// Backend/controllers/salesController.js
import pool from "../config/db.js";
import xlsx from "xlsx";
// Asumiendo que moviste buildNombreCompleto a un archivo helper
// import { buildNombreCompleto } from "../utils/helpers.js";
// Si no, descomenta la función aquí:
const buildNombreCompleto = (nombreMarca, variacion, cantidad, unidad) => {
  let parts = [nombreMarca];
  if (variacion && variacion.trim() !== "") parts.push(variacion.trim());
  const formattedCantidad = parseFloat(cantidad).toString();
  parts.push(`${formattedCantidad}${unidad}`);
  return parts.join(" ");
};
// ---

export const processSalesFile = async (req, res) => {
  console.log("--- Iniciando processSalesFile ---"); // Log inicio

  if (!req.file) {
    console.error("Error: No se subió ningún archivo.");
    return res.status(400).json({ message: "No se subió ningún archivo." });
  }

  console.log(
    `Archivo recibido: ${req.file.originalname}, Tamaño: ${req.file.size}`
  );

  // --- Leer y parsear el archivo Excel ---
  let ventas;
  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    ventas = xlsx.utils.sheet_to_json(worksheet);
    console.log(`Archivo parseado. ${ventas.length} filas encontradas.`);
    if (ventas.length === 0) {
      console.warn(
        "Advertencia: El archivo Excel está vacío o no tiene datos en la primera hoja."
      );
      return res
        .status(400)
        .json({ message: "El archivo Excel está vacío o mal formateado." });
    }
    // Verificar columnas necesarias
    if (
      !ventas[0] ||
      ventas[0].Producto === undefined ||
      ventas[0].Cantidad === undefined
    ) {
      console.error(
        "Error: Faltan las columnas 'Producto' o 'Cantidad' en el archivo Excel."
      );
      return res.status(400).json({
        message:
          "Faltan las columnas 'Producto' o 'Cantidad' en el archivo Excel.",
      });
    }
  } catch (parseError) {
    console.error("Error al parsear el archivo Excel:", parseError);
    return res.status(400).json({
      message: "Error al leer el archivo Excel.",
      error: parseError.message,
    });
  }
  // --- Fin Lectura Excel ---

  let connection;
  try {
    console.log("Intentando obtener conexión de la base de datos...");
    connection = await pool.getConnection();
    // *** VERIFICACIÓN EXPLÍCITA ***
    if (!connection || typeof connection.query !== "function") {
      console.error(
        "Error Crítico: pool.getConnection() no devolvió una conexión válida.",
        connection
      );
      throw new Error(
        "No se pudo obtener una conexión de base de datos válida."
      );
    }
    console.log("Conexión obtenida correctamente.");

    console.log("Intentando iniciar transacción...");
    await connection.beginTransaction();
    console.log("Transacción iniciada correctamente.");

    // Crear evento VENTA
    const description = `Procesamiento de ventas desde archivo: ${
      req.file?.originalname || "archivo subido"
    }`;
    console.log(
      `Intentando crear evento VENTA con descripción: "${description}"`
    );

    // *** VERIFICACIÓN ANTES DEL QUERY PROBLEMÁTICO ***
    if (!connection || typeof connection.query !== "function") {
      console.error(
        "Error Crítico: El objeto 'connection' se invalidó ANTES del INSERT del evento."
      );
      throw new Error("La conexión se perdió antes de registrar el evento.");
    }
    console.log(
      "Objeto 'connection' verificado OK antes del INSERT del evento."
    );

    // --- Línea 18 del error original ---
    const [eventoResult] = await connection.query(
      "INSERT INTO eventos_stock (tipo_evento, descripcion) VALUES ('VENTA', ?)",
      [description]
    );
    // ------------------------------------

    const eventoId = eventoResult.insertId;
    console.log(`Evento VENTA creado con ID: ${eventoId}`);

    // --- Lógica de Descuento (Asegúrate que esta parte esté implementada de la Fase 4) ---
    console.log(`Iniciando procesamiento de ${ventas.length} ventas...`);
    for (const venta of ventas) {
      const cantidadVendida = venta.Cantidad;
      const productoVendido = venta.Producto;

      if (isNaN(cantidadVendida) || cantidadVendida <= 0) {
        console.warn(
          `   Venta ignorada: Cantidad inválida (${cantidadVendida}) para producto "${productoVendido}"`
        );
        continue;
      }

      const [productoRows] = await connection.query(
        "SELECT id FROM productos WHERE nombre_producto_fudo = ? AND is_active = TRUE",
        [productoVendido]
      );

      if (productoRows.length === 0) {
        console.warn(
          `   Venta ignorada: Producto "${productoVendido}" no encontrado o inactivo.`
        );
        continue;
      }
      const productId = productoRows[0].id;
      console.log(
        `   Procesando venta: ${cantidadVendida}x "${productoVendido}" (Producto ID: ${productId})`
      );

      // Obtener reglas (incluyendo type, ids, nombres)
      const [reglasReceta] = await connection.query(
        `SELECT
              r.ingredient_type, r.item_id, r.prebatch_id, r.consumo_ml, r.prioridad_item,
              CASE WHEN r.ingredient_type = 'PREBATCH' THEN pb.nombre_prebatch ELSE NULL END as nombre_prebatch_regla,
              CASE WHEN r.ingredient_type = 'ITEM' THEN si.marca_id ELSE NULL END as marca_id_item,
              CASE WHEN r.ingredient_type = 'ITEM' THEN m.nombre ELSE NULL END as nombre_marca_item
            FROM recetas r
            LEFT JOIN prebatches pb ON r.ingredient_type = 'PREBATCH' AND r.prebatch_id = pb.id
            LEFT JOIN stock_items si ON r.ingredient_type = 'ITEM' AND r.item_id = si.id
            LEFT JOIN marcas m ON si.marca_id = m.id
            WHERE r.producto_id = ?`,
        [productId]
      );

      if (reglasReceta.length === 0) {
        console.warn(
          `     Venta ignorada: No se encontraron reglas de receta para el producto ID ${productId}.`
        );
        continue;
      }

      // --- Iterar Reglas y Descontar ---
      for (const regla of reglasReceta) {
        console.log(
          `     Aplicando regla: Tipo=${regla.ingredient_type}, Consumo=${regla.consumo_ml}ml`
        );
        let consumoTotalMl = regla.consumo_ml * cantidadVendida;

        if (consumoTotalMl <= 0.001) continue;

        if (regla.ingredient_type === "ITEM") {
          if (!regla.item_id || !regla.marca_id_item) {
            console.error(
              `       Error Crítico: Regla ITEM incompleta (item_id: ${regla.item_id}, marca_id: ${regla.marca_id_item}). Saltando.`
            );
            continue;
          }
          console.log(
            `       Tipo ITEM. Buscando items priorizados para marca ID ${regla.marca_id_item} (${regla.nombre_marca_item})`
          );

          // Buscar Items Priorizados
          const [itemsPriorizados] = await connection.query(
            `SELECT
                      si.id as item_id, si.stock_unidades, si.variacion, si.cantidad_por_envase, si.unidad_medida, m.nombre as nombre_marca
                    FROM stock_items si
                    JOIN marcas m ON si.marca_id = m.id
                    JOIN recetas r ON r.item_id = si.id -- Unir con recetas para obtener prioridad
                    WHERE r.producto_id = ? AND r.ingredient_type = 'ITEM' AND si.marca_id = ? AND si.stock_unidades > 0.001 AND si.is_active = TRUE
                    ORDER BY r.prioridad_item ASC`,
            [productId, regla.marca_id_item]
          );

          if (itemsPriorizados.length === 0) {
            throw new Error(
              `Stock insuficiente o items no configurados para "${regla.nombre_marca_item}" en la receta de "${productoVendido}".`
            );
          }

          // Descontar Items
          for (const item of itemsPriorizados) {
            if (consumoTotalMl <= 0.001) break;
            // ... (lógica de cálculo: aDescontarEnUnidades, stockNuevoRedondeado) ...
            const nombreCompletoItem = buildNombreCompleto(
              item.nombre_marca,
              item.variacion,
              item.cantidad_por_envase,
              item.unidad_medida
            );
            if (!item.cantidad_por_envase || item.cantidad_por_envase <= 0) {
              console.warn(
                `       Advertencia: Cantidad por envase inválida para ${nombreCompletoItem} (ID: ${item.item_id}). Saltando.`
              );
              continue;
            }
            let cantidadConsumidaEnUnidadBase = consumoTotalMl;
            if (item.unidad_medida === "g") {
              console.log(
                `         INFO: Asumiendo 1ml=1g para ${nombreCompletoItem}`
              );
            }
            const stockDisponibleEnUnidadBase =
              item.stock_unidades * item.cantidad_por_envase;
            const aDescontarDeEsteItemEnUnidadBase = Math.min(
              cantidadConsumidaEnUnidadBase,
              stockDisponibleEnUnidadBase
            );
            const aDescontarEnUnidades =
              aDescontarDeEsteItemEnUnidadBase / item.cantidad_por_envase;
            const [stockActualRows] = await connection.query(
              "SELECT stock_unidades FROM stock_items WHERE id = ? FOR UPDATE",
              [item.item_id]
            );
            if (stockActualRows.length === 0)
              throw new Error(`Item ID ${item.item_id} no encontrado.`);
            const stockAnterior = stockActualRows[0].stock_unidades;
            const stockNuevo = stockAnterior - aDescontarEnUnidades;
            if (stockNuevo < -0.001)
              throw new Error(
                `Stock insuficiente detectado para "${nombreCompletoItem}".`
              );
            const stockNuevoRedondeado = parseFloat(stockNuevo.toFixed(5));

            await connection.query(
              "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
              [stockNuevoRedondeado, item.item_id]
            );
            console.log(
              `         Stock item ${
                item.item_id
              } (${nombreCompletoItem}) actualizado: ${stockAnterior.toFixed(
                3
              )} -> ${stockNuevoRedondeado.toFixed(3)}`
            );
            const descMovimientoItem = `Venta: ${cantidadVendida}x ${productoVendido} (descuento de ${nombreCompletoItem})`;
            await connection.query(
              `INSERT INTO stock_movements (item_id, tipo_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo, descripcion, evento_id, prebatch_id_afectado)
                        VALUES (?, 'CONSUMO', ?, ?, ?, ?, ?, NULL)`,
              [
                item.item_id,
                -aDescontarEnUnidades,
                stockAnterior,
                stockNuevoRedondeado,
                descMovimientoItem,
                eventoId,
              ]
            );
            console.log(
              `         Movimiento registrado para item ${item.item_id}`
            );
            consumoTotalMl -= aDescontarDeEsteItemEnUnidadBase;
          } // Fin for itemsPriorizados

          if (consumoTotalMl > 0.01) {
            throw new Error(
              `Stock insuficiente para ${consumoTotalMl.toFixed(1)}ml de "${
                regla.nombre_marca_item
              }" en venta de "${productoVendido}".`
            );
          }
        } else if (regla.ingredient_type === "PREBATCH") {
          if (!regla.prebatch_id || !regla.nombre_prebatch_regla) {
            console.error(
              `       Error Crítico: Regla PREBATCH incompleta (prebatch_id: ${regla.prebatch_id}, nombre: ${regla.nombre_prebatch_regla}). Saltando.`
            );
            continue;
          }
          console.log(
            `       Tipo PREBATCH. Buscando lotes para "${regla.nombre_prebatch_regla}" (ID Regla: ${regla.prebatch_id})`
          );

          // Buscar Lotes
          const [lotesPrebatch] = await connection.query(
            `SELECT id, cantidad_actual_ml FROM prebatches WHERE nombre_prebatch = ? AND is_active = TRUE AND cantidad_actual_ml > 0.001 ORDER BY fecha_produccion ASC FOR UPDATE`,
            [regla.nombre_prebatch_regla]
          );

          if (lotesPrebatch.length === 0) {
            throw new Error(
              `Stock insuficiente: No hay lotes activos/con cantidad para "${regla.nombre_prebatch_regla}" en venta de "${productoVendido}".`
            );
          }

          // Descontar Lotes
          for (const lote of lotesPrebatch) {
            if (consumoTotalMl <= 0.001) break;
            // ... (lógica de cálculo: aDescontarDeEsteLote, nuevaCantidadLoteRedondeada) ...
            const cantidadEnLote = lote.cantidad_actual_ml;
            const aDescontarDeEsteLote = Math.min(
              consumoTotalMl,
              cantidadEnLote
            );
            const nuevaCantidadLote = cantidadEnLote - aDescontarDeEsteLote;
            const nuevaCantidadLoteRedondeada = parseFloat(
              nuevaCantidadLote.toFixed(5)
            );

            await connection.query(
              "UPDATE prebatches SET cantidad_actual_ml = ? WHERE id = ?",
              [nuevaCantidadLoteRedondeada, lote.id]
            );
            console.log(
              `         Stock prebatch Lote ID ${lote.id} (${
                regla.nombre_prebatch_regla
              }) actualizado: ${cantidadEnLote.toFixed(
                3
              )}ml -> ${nuevaCantidadLoteRedondeada.toFixed(3)}ml`
            );

            consumoTotalMl -= aDescontarDeEsteLote;
          } // Fin for lotesPrebatch

          if (consumoTotalMl > 0.01) {
            throw new Error(
              `Stock insuficiente para ${consumoTotalMl.toFixed(
                1
              )}ml de prebatch "${
                regla.nombre_prebatch_regla
              }" en venta de "${productoVendido}".`
            );
          }
        } // Fin if/else ingredient_type
      } // Fin bucle reglasReceta
    } // Fin bucle ventas
    // --- Fin Lógica Descuento ---

    console.log("Proceso de descuento finalizado. Intentando commit...");
    await connection.commit();
    console.log("Commit realizado con éxito.");
    res
      .status(200)
      .json({ message: "Ventas procesadas y stock actualizado con éxito." });
  } catch (error) {
    console.error("Error durante el procesamiento de ventas:", error); // Log del error completo
    if (connection) {
      console.log("Intentando rollback...");
      try {
        // Añadir try/catch al rollback por si acaso
        await connection.rollback();
        console.log("Rollback realizado.");
      } catch (rollbackError) {
        console.error("Error durante el rollback:", rollbackError);
      }
    }
    res.status(500).json({
      message: error.message || "Error al procesar el archivo de ventas.",
      error: error.message,
    });
  } finally {
    if (connection) {
      console.log("Liberando conexión...");
      try {
        // Añadir try/catch al release
        connection.release();
        console.log("Conexión liberada.");
      } catch (releaseError) {
        console.error("Error al liberar la conexión:", releaseError);
      }
    }
    console.log("--- Finalizando processSalesFile ---"); // Log fin
  }
};
