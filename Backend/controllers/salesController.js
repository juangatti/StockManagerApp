import pool from "../config/db.js"; //
import xlsx from "xlsx";

// --- Función Helper (igual que en otros controllers) ---
const buildNombreCompleto = (nombreMarca, variacion, equivalenciaMl) => {
  let parts = [nombreMarca];
  if (variacion && variacion.trim() !== "") {
    parts.push(variacion.trim());
  }
  parts.push(`${equivalenciaMl}ml`);
  return parts.join(" ");
};

export const processSalesFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se subió ningún archivo." });
  }

  const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const ventas = xlsx.utils.sheet_to_json(worksheet);

  const connection = await pool.getConnection(); //

  try {
    await connection.beginTransaction();

    const descEvento = `Procesamiento de ventas (Archivo: ${
      req.file.originalname || "desconocido"
    })`;
    const [eventoResult] = await connection.query(
      "INSERT INTO eventos_stock (tipo_evento, descripcion) VALUES ('VENTA', ?)",
      [descEvento]
    );
    const eventoId = eventoResult.insertId;

    for (const venta of ventas) {
      const productoVendido = venta.Producto;
      const cantidadVendida = venta.Cantidad;

      // Validar cantidad
      if (isNaN(cantidadVendida) || cantidadVendida <= 0) {
        console.log(
          `Advertencia: Cantidad inválida (${cantidadVendida}) para producto "${productoVendido}". Saltando.`
        );
        continue;
      }

      const [productoRows] = await connection.query(
        "SELECT id FROM productos WHERE nombre_producto_fudo = ? AND is_active = TRUE", // Buscar solo activos
        [productoVendido]
      );
      if (productoRows.length === 0) {
        console.log(
          `Advertencia: Producto "${productoVendido}" no encontrado o inactivo. Saltando venta.`
        );
        continue;
      }
      const productoId = productoRows[0].id;

      const [reglasReceta] = await connection.query(
        // Asegurarse de que la receta exista y traiga los datos necesarios
        `SELECT DISTINCT
            r.marca_id,
            r.consumo_ml
          FROM recetas r
          JOIN stock_items si ON r.item_id = si.id
          JOIN marcas m ON r.marca_id = m.id -- Unir con marcas para validar que existe
          WHERE r.producto_id = ?`,
        [productoId]
      );

      if (reglasReceta.length === 0) {
        console.log(
          `Advertencia: No se encontraron reglas de receta válidas para "${productoVendido}". Saltando venta.`
        );
        continue; // Saltar si no hay receta
      }

      for (const regla of reglasReceta) {
        let consumoTotalMl = regla.consumo_ml * cantidadVendida;

        // La consulta de items priorizados necesita traer la variación
        const [itemsPriorizados] = await connection.query(
          `SELECT
             r.item_id,
             si.stock_unidades,
             si.variacion,          -- <-- Seleccionar variación
             si.equivalencia_ml,
             m.nombre as nombre_marca -- Necesitamos nombre de marca para construir nombre completo
           FROM recetas r
           JOIN stock_items si ON r.item_id = si.id
           JOIN marcas m ON si.marca_id = m.id -- Unir con marcas
           WHERE r.producto_id = ? AND r.marca_id = ? AND si.stock_unidades > 0 AND si.is_active = TRUE -- Solo items activos
           ORDER BY r.prioridad_item ASC`,
          [productoId, regla.marca_id]
        );

        for (const item of itemsPriorizados) {
          if (consumoTotalMl <= 0.001) break; // Usar tolerancia pequeña para floats

          const stockDisponibleEnMl =
            item.stock_unidades * item.equivalencia_ml;
          const aDescontarDeEsteItemEnMl = Math.min(
            consumoTotalMl,
            stockDisponibleEnMl
          );

          // Evitar divisiones por cero o valores inválidos
          if (item.equivalencia_ml <= 0) {
            console.log(
              `Advertencia: Equivalencia inválida (${item.equivalencia_ml}) para item ID ${item.item_id}. Saltando descuento.`
            );
            continue;
          }

          const aDescontarEnUnidades =
            aDescontarDeEsteItemEnMl / item.equivalencia_ml;

          // Obtener stock actual con bloqueo
          const [stockActualRows] = await connection.query(
            "SELECT stock_unidades FROM stock_items WHERE id = ? FOR UPDATE",
            [item.item_id]
          );
          if (stockActualRows.length === 0) {
            // Esto no debería pasar si la consulta anterior funcionó, pero por si acaso
            throw new Error(
              `Item ID ${item.item_id} desapareció inesperadamente.`
            );
          }

          const stockAnterior = stockActualRows[0].stock_unidades;
          const stockNuevo = stockAnterior - aDescontarEnUnidades;

          // Usar tolerancia para comparación de floats
          if (stockNuevo < -0.001) {
            // Construir nombre completo para el mensaje de error
            const nombreCompletoItemError = buildNombreCompleto(
              item.nombre_marca,
              item.variacion,
              item.equivalencia_ml
            );
            throw new Error(
              `Stock insuficiente para "${nombreCompletoItemError}" (ID: ${
                item.item_id
              }) al procesar venta de "${productoVendido}". Necesita: ${aDescontarEnUnidades.toFixed(
                3
              )}, Disponible: ${stockAnterior.toFixed(3)}`
            );
          }
          // Redondear stock nuevo para evitar problemas de precisión flotante muy pequeños
          const stockNuevoRedondeado = parseFloat(stockNuevo.toFixed(5));

          await connection.query(
            "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
            [stockNuevoRedondeado, item.item_id]
          );

          // Construir nombre completo para descripción
          const nombreCompletoItemDesc = buildNombreCompleto(
            item.nombre_marca,
            item.variacion,
            item.equivalencia_ml
          );
          const descripcionMovimiento = `Venta: ${cantidadVendida}x ${productoVendido} (descuento de ${nombreCompletoItemDesc})`;

          await connection.query(
            `INSERT INTO stock_movements (item_id, tipo_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo, descripcion, evento_id) VALUES (?, 'VENTA', ?, ?, ?, ?, ?)`,
            [
              item.item_id,
              -aDescontarEnUnidades, // Guardar la cantidad exacta descontada
              stockAnterior,
              stockNuevoRedondeado, // Guardar el stock redondeado
              descripcionMovimiento,
              eventoId,
            ]
          );

          consumoTotalMl -= aDescontarDeEsteItemEnMl;
        }

        if (consumoTotalMl > 0.01) {
          // Obtener nombre de la marca para el error
          const [marcaInfo] = await connection.query(
            "SELECT nombre FROM marcas WHERE id = ?",
            [regla.marca_id]
          );
          const nombreMarcaError =
            marcaInfo.length > 0 ? marcaInfo[0].nombre : `ID ${regla.marca_id}`;
          throw new Error(
            `Stock insuficiente para la marca "${nombreMarcaError}" en la venta de "${productoVendido}". Faltaron ${consumoTotalMl.toFixed(
              2
            )}ml por descontar.`
          );
        }
      }
    }

    await connection.commit();
    res.status(200).json({ message: "Ventas procesadas con éxito." });
  } catch (error) {
    await connection.rollback();
    console.error("Error durante el procesamiento de ventas:", error); // Loggear el error completo
    // Devolver un mensaje más específico si es posible
    res.status(500).json({
      message: "Error al procesar las ventas.",
      error: error.message || "Error desconocido",
    });
  } finally {
    connection.release();
  }
};
