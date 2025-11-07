import pool from "../config/db.js";
import xlsx from "xlsx";
// Importar la función helper (si la moviste) o definirla aquí
import { buildNombreCompleto } from "../utils/helpers.js";

export const processSalesFile = async (req, res) => {
  console.log("--- Iniciando processSalesFile (Versión con Variantes) ---");

  if (!req.file) {
    return res.status(400).json({ message: "No se subió ningún archivo." });
  }

  let ventas;
  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    ventas = xlsx.utils.sheet_to_json(worksheet);
    console.log(`Archivo parseado. ${ventas.length} filas encontradas.`);
    if (ventas.length === 0) {
      return res.status(400).json({ message: "El archivo Excel está vacío." });
    }
    if (!ventas[0].Producto || ventas[0].Cantidad === undefined) {
      return res
        .status(400)
        .json({ message: "Faltan columnas 'Producto' o 'Cantidad'." });
    }
  } catch (parseError) {
    console.error("Error al parsear el archivo Excel:", parseError);
    return res.status(400).json({ message: "Error al leer el archivo Excel." });
  }

  let connection;
  try {
    console.log("Obteniendo conexión...");
    connection = await pool.getConnection();
    console.log("Conexión obtenida. Iniciando transacción principal...");
    await connection.beginTransaction();

    const description = `Procesamiento de ventas desde archivo: ${req.file.originalname}`;
    const [eventoResult] = await connection.query(
      "INSERT INTO eventos_stock (tipo_evento, descripcion) VALUES ('VENTA', ?)",
      [description]
    );
    const eventoId = eventoResult.insertId;
    console.log(`Evento VENTA creado con ID: ${eventoId}`);

    // --- Inicio Bucle de Ventas ---
    for (const venta of ventas) {
      const cantidadVendida = venta.Cantidad;
      const productoVendido = venta.Producto;

      if (isNaN(cantidadVendida) || cantidadVendida <= 0) {
        console.warn(
          `Venta ignorada: Cantidad inválida (${cantidadVendida}) para "${productoVendido}"`
        );
        continue;
      }

      const [productoRows] = await connection.query(
        "SELECT id FROM productos WHERE nombre_producto_fudo = ? AND is_active = TRUE",
        [productoVendido]
      );

      if (productoRows.length === 0) {
        console.warn(
          `Venta ignorada: Producto "${productoVendido}" no encontrado o inactivo.`
        );
        continue;
      }
      const productId = productoRows[0].id;
      console.log(
        `Procesando venta: ${cantidadVendida}x "${productoVendido}" (Producto ID: ${productId})`
      );

      // 1. OBTENER REGLAS ORDENADAS POR VARIANTE
      const [reglasReceta] = await connection.query(
        `SELECT
           r.recipe_variant, r.ingredient_type, r.item_id, r.prebatch_id, 
           r.consumo_ml, r.prioridad_item,
           pb.nombre_prebatch as nombre_prebatch_regla,
           si.marca_id as marca_id_item,
           m.nombre as nombre_marca_item
         FROM recetas r
         LEFT JOIN prebatches pb ON r.ingredient_type = 'PREBATCH' AND r.prebatch_id = pb.id
         LEFT JOIN stock_items si ON r.ingredient_type = 'ITEM' AND r.item_id = si.id
         LEFT JOIN marcas m ON si.marca_id = m.id
         WHERE r.producto_id = ?
         ORDER BY r.recipe_variant ASC, r.id ASC`, // <-- ORDENAR POR VARIANTE
        [productId]
      );

      if (reglasReceta.length === 0) {
        console.warn(
          `Venta ignorada: No se encontraron reglas de receta para ID ${productId}.`
        );
        continue;
      }

      // 2. AGRUPAR REGLAS POR VARIANTE
      const variantes = reglasReceta.reduce((acc, regla) => {
        const variantKey = regla.recipe_variant;
        if (!acc[variantKey]) {
          acc[variantKey] = [];
        }
        acc[variantKey].push(regla);
        return acc;
      }, {});
      console.log(
        `   Producto ID ${productId} tiene ${
          Object.keys(variantes).length
        } variante(s)`
      );

      // 3. ITERAR VARIANTES E INTENTAR CONSUMIR
      let varianteConsumida = false;
      // Iteramos sobre las keys (ej. [1, 2]) ya ordenadas por la consulta SQL
      for (const variantPriority in variantes) {
        const reglasVariante = variantes[variantPriority];
        console.log(`   Intentando Variante ${variantPriority}...`);

        const savepointName = `variante_${variantPriority}`;

        try {
          // 4. CREAR SAVEPOINT
          await connection.query(`SAVEPOINT ${savepointName}`);

          // 5. INTENTAR CONSUMIR TODOS LOS INGREDIENTES DE ESTA VARIANTE
          for (const regla of reglasVariante) {
            console.log(
              `     Aplicando regla: Tipo=${regla.ingredient_type}, Consumo=${regla.consumo_ml}ml`
            );
            let consumoTotalMl = regla.consumo_ml * cantidadVendida;

            if (consumoTotalMl <= 0.001) continue;

            // --- Lógica de descuento 'ITEM' (SIN CAMBIOS, PERO DENTRO DEL TRY) ---
            if (regla.ingredient_type === "ITEM") {
              if (!regla.item_id || !regla.marca_id_item) {
                throw new Error(
                  `Regla ITEM incompleta (item_id: ${regla.item_id}, marca_id: ${regla.marca_id_item})`
                );
              }

              const [itemsPriorizados] = await connection.query(
                `SELECT si.id as item_id, si.stock_unidades, si.variacion, si.cantidad_por_envase, si.unidad_medida, m.nombre as nombre_marca
                  FROM stock_items si
                  JOIN marcas m ON si.marca_id = m.id
                  WHERE si.marca_id = ? AND si.stock_unidades > 0.001 AND si.is_active = TRUE
                  ORDER BY (SELECT r_inner.prioridad_item FROM recetas r_inner WHERE r_inner.item_id = si.id AND r_inner.producto_id = ? LIMIT 1) ASC`,
                [regla.marca_id_item, productId]
              );

              if (itemsPriorizados.length === 0) {
                throw new Error(
                  `Stock insuficiente (items no encontrados) para "${regla.nombre_marca_item}"`
                );
              }

              for (const item of itemsPriorizados) {
                if (consumoTotalMl <= 0.001) break;

                const nombreCompletoItem = buildNombreCompleto(
                  item.nombre_marca,
                  item.variacion,
                  item.cantidad_por_envase,
                  item.unidad_medida
                );
                if (
                  !item.cantidad_por_envase ||
                  item.cantidad_por_envase <= 0
                ) {
                  console.warn(
                    `Advertencia: Cantidad por envase inválida para ${nombreCompletoItem}. Saltando.`
                  );
                  continue;
                }

                let cantidadConsumidaEnUnidadBase = consumoTotalMl;
                if (item.unidad_medida === "g")
                  console.log(
                    `INFO: Asumiendo 1ml=1g para ${nombreCompletoItem}`
                  );

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

                if (stockNuevo < -0.001) {
                  // Este error será capturado por el catch y provocará el rollback de la variante
                  throw new Error(
                    `Stock insuficiente (cálculo) para "${nombreCompletoItem}"`
                  );
                }

                const stockNuevoRedondeado = parseFloat(stockNuevo.toFixed(5));
                await connection.query(
                  "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
                  [stockNuevoRedondeado, item.item_id]
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

                consumoTotalMl -= aDescontarDeEsteItemEnUnidadBase;
              } // Fin for itemsPriorizados

              if (consumoTotalMl > 0.01) {
                throw new Error(
                  `Stock insuficiente (restante) para ${consumoTotalMl.toFixed(
                    1
                  )}ml de "${regla.nombre_marca_item}"`
                );
              }

              // --- Lógica de descuento 'PREBATCH' (SIN CAMBIOS, PERO DENTRO DEL TRY) ---
            } else if (regla.ingredient_type === "PREBATCH") {
              if (!regla.prebatch_id || !regla.nombre_prebatch_regla) {
                throw new Error(
                  `Regla PREBATCH incompleta (id: ${regla.prebatch_id}, nombre: ${regla.nombre_prebatch_regla})`
                );
              }

              const [lotesPrebatch] = await connection.query(
                `SELECT id, cantidad_actual_ml FROM prebatches WHERE nombre_prebatch = ? AND is_active = TRUE AND cantidad_actual_ml > 0.001 ORDER BY fecha_produccion ASC FOR UPDATE`,
                [regla.nombre_prebatch_regla]
              );

              if (lotesPrebatch.length === 0) {
                throw new Error(
                  `Stock insuficiente (lotes no encontrados) para "${regla.nombre_prebatch_regla}"`
                );
              }

              for (const lote of lotesPrebatch) {
                if (consumoTotalMl <= 0.001) break;

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

                // ¡YA NO INSERTAMOS EN STOCK_MOVEMENTS! (según decisión anterior)

                consumoTotalMl -= aDescontarDeEsteLote;
              } // Fin for lotesPrebatch

              if (consumoTotalMl > 0.01) {
                throw new Error(
                  `Stock insuficiente (restante) para ${consumoTotalMl.toFixed(
                    1
                  )}ml de prebatch "${regla.nombre_prebatch_regla}"`
                );
              }
            } // Fin if/else ingredient_type
          } // Fin bucle reglasVariante

          // 6. ÉXITO DE LA VARIANTE
          varianteConsumida = true;
          await connection.query(`RELEASE SAVEPOINT ${savepointName}`); // Confirmar los cambios de esta variante
          console.log(`   Variante ${variantPriority} consumida con éxito.`);
          break; // Salir del bucle de variantes
        } catch (error) {
          // 7. FALLO DE LA VARIANTE
          await connection.query(`ROLLBACK TO SAVEPOINT ${savepointName}`); // Revertir al savepoint
          console.warn(
            `   Falló Variante ${variantPriority}: ${error.message}`
          );
          // No hacer 'break', el bucle for...in continuará con la siguiente variante (si hay)
        }
      } // Fin bucle variantes

      // 8. VERIFICACIÓN FINAL
      if (!varianteConsumida) {
        // Si ninguna variante tuvo éxito, lanzamos un error que revertirá toda la transacción de la venta
        throw new Error(
          `Stock insuficiente para TODAS las variantes de "${productoVendido}".`
        );
      }
    } // Fin Bucle de Ventas

    console.log(
      "Proceso de descuento finalizado. Haciendo commit principal..."
    );
    await connection.commit();
    console.log("Commit realizado.");
    res
      .status(200)
      .json({ message: "Ventas procesadas y stock actualizado con éxito." });
  } catch (error) {
    // Error en la transacción principal (ej. el error de "Stock insuficiente" de arriba)
    console.error(
      "Error durante el procesamiento de ventas (transacción principal):",
      error
    );
    if (connection) {
      console.log("Intentando rollback principal...");
      try {
        await connection.rollback();
        console.log("Rollback principal realizado.");
      } catch (rollbackError) {
        console.error("Error durante el rollback principal:", rollbackError);
      }
    }
    res.status(500).json({
      message: error.message || "Error al procesar el archivo de ventas.",
      error: error.message,
    });
  } finally {
    if (connection) {
      console.log("Liberando conexión...");
      connection.release();
    }
    console.log("--- Finalizando processSalesFile ---");
  }
};
