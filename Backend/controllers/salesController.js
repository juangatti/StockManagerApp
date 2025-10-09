import pool from "../config/db.js";
import xlsx from "xlsx";

export const processSalesFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se subió ningún archivo." });
  }

  const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const ventas = xlsx.utils.sheet_to_json(worksheet);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const venta of ventas) {
      const productoVendido = venta.Producto;
      const cantidadVendida = venta.Cantidad;

      const [productoRows] = await connection.query(
        "SELECT id FROM productos WHERE nombre_producto_fudo = ?",
        [productoVendido]
      );
      if (productoRows.length === 0) {
        console.log(
          `Advertencia: Producto "${productoVendido}" no encontrado.`
        );
        continue;
      }
      const productoId = productoRows[0].id;

      // 1. CORRECCIÓN: Ahora buscamos por 'marca_id'
      const [reglasReceta] = await connection.query(
        "SELECT DISTINCT marca_id, consumo_ml FROM recetas WHERE producto_id = ?",
        [productoId]
      );

      for (const regla of reglasReceta) {
        let consumoTotalMl = regla.consumo_ml * cantidadVendida;

        // 2. CORRECCIÓN: La consulta para priorizar items ahora también usa 'marca_id'
        const [itemsPriorizados] = await connection.query(
          `SELECT r.item_id, si.stock_unidades, si.equivalencia_ml, CONCAT(m.nombre, ' ', si.equivalencia_ml, 'ml') as nombre_completo
           FROM recetas r
           JOIN stock_items si ON r.item_id = si.id
           JOIN marcas m ON si.marca_id = m.id
           WHERE r.producto_id = ? AND r.marca_id = ? AND si.stock_unidades > 0
           ORDER BY r.prioridad_item ASC`,
          [productoId, regla.marca_id]
        );

        for (const item of itemsPriorizados) {
          if (consumoTotalMl <= 0) break;

          const stockDisponibleEnMl =
            item.stock_unidades * item.equivalencia_ml;
          const aDescontarDeEsteItemEnMl = Math.min(
            consumoTotalMl,
            stockDisponibleEnMl
          );
          const aDescontarEnUnidades =
            aDescontarDeEsteItemEnMl / item.equivalencia_ml;

          const [stockActualRows] = await connection.query(
            "SELECT stock_unidades FROM stock_items WHERE id = ? FOR UPDATE",
            [item.item_id]
          );
          const stockAnterior = stockActualRows[0].stock_unidades;
          const stockNuevo = stockAnterior - aDescontarEnUnidades;

          if (stockNuevo < 0) {
            throw new Error(
              `Stock insuficiente para el item ID ${item.item_id}`
            );
          }

          await connection.query(
            "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
            [stockNuevo, item.item_id]
          );

          // 3. CORRECCIÓN: Usamos el nuevo nombre construido para la descripción
          const descripcionMovimiento = `Venta: ${cantidadVendida}x ${productoVendido} (descuento de ${item.nombre_completo})`;

          await connection.query(
            `INSERT INTO stock_movements (item_id, tipo_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo, descripcion) VALUES (?, 'VENTA', ?, ?, ?, ?)`,
            [
              item.item_id,
              -aDescontarEnUnidades,
              stockAnterior,
              stockNuevo,
              descripcionMovimiento,
            ]
          );

          consumoTotalMl -= aDescontarDeEsteItemEnMl;
        }

        if (consumoTotalMl > 0.01) {
          // 4. CORRECCIÓN: El mensaje de error ahora se refiere a 'marca_id'
          throw new Error(
            `Stock insuficiente para la marca ID ${regla.marca_id} en la venta de "${productoVendido}".`
          );
        }
      }
    }

    await connection.commit();
    res.status(200).json({ message: "Ventas procesadas con éxito." });
  } catch (error) {
    await connection.rollback();
    console.error("Error durante el procesamiento de ventas:", error.message);
    res
      .status(500)
      .json({ message: "Error al procesar las ventas.", error: error.message });
  } finally {
    connection.release();
  }
};
