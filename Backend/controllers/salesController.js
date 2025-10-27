import pool from "../config/db.js"; //
import xlsx from "xlsx";
import { buildNombreCompleto } from "../utils/helpers.js"; //
// --- Función Helper (igual que en otros controllers) ---

export const processSalesFile = async (req, res) => {
  // ... (lectura de archivo y inicio transacción sin cambios) ...
  if (!req.file) {
    /* ... */
  }
  const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
  // ...
  let connection;
  try {
    connection = await pool.getConnection(); //
    await connection.beginTransaction();
    // ... (Crear evento VENTA) ...
    const [eventoResult] = await connection.query(/* ... */);
    const eventoId = eventoResult.insertId;

    for (const venta of ventas) {
      const productoVendido = venta.Producto;
      const cantidadVendida = venta.Cantidad;
      // ... (Validar cantidad, buscar productoId) ...
      if (isNaN(cantidadVendida) || cantidadVendida <= 0) continue;
      const [productoRows] = await connection.query(/* ... */);
      if (productoRows.length === 0) continue;
      const productoId = productoRows[0].id;

      // Obtener reglas de receta (sin cambios aquí)
      const [reglasReceta] = await connection.query(
        `SELECT DISTINCT r.marca_id, r.consumo_ml, m.nombre AS nombre_marca FROM recetas r JOIN marcas m ... WHERE r.producto_id = ?`,
        [productId]
      );
      if (reglasReceta.length === 0) continue;

      for (const regla of reglasReceta) {
        let consumoTotalMl = regla.consumo_ml * cantidadVendida; // Consumo requerido en ML

        if (consumoTotalMl <= 0) continue;

        // Obtener items priorizados (incluyendo unidad_medida y cantidad_por_envase)
        const [itemsPriorizados] = await connection.query(
          `SELECT
             r.item_id,
             si.stock_unidades,
             si.variacion,
             si.cantidad_por_envase, -- <-- Nueva
             si.unidad_medida,       -- <-- Nueva
             m.nombre as nombre_marca
           FROM recetas r
           JOIN stock_items si ON r.item_id = si.id
           JOIN marcas m ON si.marca_id = m.id
           WHERE r.producto_id = ? AND r.marca_id = ? AND si.stock_unidades > 0 AND si.is_active = TRUE
           ORDER BY r.prioridad_item ASC`,
          [productId, regla.marca_id]
        );

        for (const item of itemsPriorizados) {
          if (consumoTotalMl <= 0.001) break;

          const nombreCompletoItem = buildNombreCompleto(
            item.nombre_marca,
            item.variacion,
            item.cantidad_por_envase,
            item.unidad_medida
          ); // Construir nombre

          // Verificar cantidad_por_envase
          if (item.cantidad_por_envase <= 0) {
            console.warn(
              `Advertencia: Cantidad por envase inválida para ${nombreCompletoItem} (ID: ${item.item_id}). Saltando.`
            );
            continue;
          }

          // --- Calcular unidades a descontar (Ajuste 1:1 para sólidos) ---
          let cantidadConsumidaEnUnidadBase = consumoTotalMl; // Asumir ml
          if (item.unidad_medida === "g") {
            // TODO: Implementar conversión con densidad si es necesaria. Asumiendo 1ml = 1g.
            console.log(
              `   INFO: Venta - Asumiendo 1ml = 1g para item sólido ${nombreCompletoItem}`
            );
            // cantidadConsumidaEnUnidadBase = consumoTotalMl; // Sigue siendo el mismo número
          }

          // Calcular cuánto de la unidad base (ml o g) hay disponible en stock
          const stockDisponibleEnUnidadBase =
            item.stock_unidades * item.cantidad_por_envase;

          // Determinar cuánto consumir de este item (en la unidad base del item)
          const aDescontarDeEsteItemEnUnidadBase = Math.min(
            cantidadConsumidaEnUnidadBase, // Lo que necesitamos (ya sea ml o g asumido)
            stockDisponibleEnUnidadBase // Lo que hay disponible
          );

          // Calcular unidades de envase a descontar
          const aDescontarEnUnidades =
            aDescontarDeEsteItemEnUnidadBase / item.cantidad_por_envase;
          // --- Fin cálculo ---

          // ... (Obtener stock actual FOR UPDATE) ...
          const [stockActualRows] = await connection.query(
            "SELECT stock_unidades FROM stock_items WHERE id = ? FOR UPDATE",
            [item.item_id]
          );
          if (stockActualRows.length === 0)
            throw new Error(`Item ID ${item.item_id} no encontrado...`);
          const stockAnterior = stockActualRows[0].stock_unidades;
          const stockNuevo = stockAnterior - aDescontarEnUnidades;

          // ... (Verificar stock < -0.001, Redondear, UPDATE stock_items) ...
          if (stockNuevo < -0.001) {
            throw new Error(
              `Stock insuficiente para "${nombreCompletoItem}"...`
            );
          }
          const stockNuevoRedondeado = parseFloat(stockNuevo.toFixed(5));
          await connection.query(
            "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
            [stockNuevoRedondeado, item.item_id]
          );

          // ... (INSERT stock_movements) ...
          const descripcionMovimiento = `Venta: ${cantidadVendida}x ${productoVendido} (descuento de ${nombreCompletoItem})`;
          await connection.query(
            `INSERT INTO stock_movements (...) VALUES (?, 'VENTA', ?, ?, ?, ?, ?)`,
            [
              item.item_id,
              -aDescontarEnUnidades,
              stockAnterior,
              stockNuevoRedondeado,
              descripcionMovimiento,
              eventoId,
            ]
          );

          // Restar lo consumido (en ML, porque consumoTotalMl está en ML)
          consumoTotalMl -= aDescontarDeEsteItemEnUnidadBase; // Restamos la cantidad en la unidad base (ml o g asumido)
        } // Fin bucle itemsPriorizados

        // ... (Verificar si consumoTotalMl > 0.01 y lanzar error) ...
        if (consumoTotalMl > 0.01) {
          throw new Error(
            `Stock insuficiente para la marca "${regla.nombre_marca}"...`
          );
        }
      } // Fin bucle reglasReceta
    } // Fin bucle ventas

    await connection.commit();
    res.status(200).json({ message: "Ventas procesadas con éxito." });
  } catch (error) {
    /* ... (rollback, manejo de error) ... */
    await connection.rollback();
    console.error("Error durante el procesamiento de ventas:", error);
    res.status(500).json({
      message: error.message || "Error al procesar...",
      error: error.message,
    });
  } finally {
    /* ... (release connection) ... */
    if (connection) connection.release();
  }
};
