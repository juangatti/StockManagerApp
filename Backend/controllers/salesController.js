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

      const [recetaRows] = await connection.query(
        "SELECT r.ingrediente_id, r.consumo_ml FROM recetas r JOIN productos p ON r.producto_id = p.id WHERE p.nombre_producto_fudo = ?",
        [productoVendido]
      );

      if (recetaRows.length === 0) {
        console.log(
          `Advertencia: No se encontró receta para "${productoVendido}".`
        );
        continue;
      }

      for (const receta of recetaRows) {
        let consumoTotalMl = receta.consumo_ml * cantidadVendida;

        const [items] = await connection.query(
          "SELECT * FROM stock_items WHERE ingrediente_id = ? AND stock_unidades > 0 ORDER BY prioridad_consumo ASC",
          [receta.ingrediente_id]
        );

        for (const item of items) {
          if (consumoTotalMl <= 0) break;

          const stockDisponibleEnMl =
            item.stock_unidades * item.equivalencia_ml;
          const aDescontarDeEsteItemEnMl = Math.min(
            consumoTotalMl,
            stockDisponibleEnMl
          );
          const aDescontarEnUnidades =
            aDescontarDeEsteItemEnMl / item.equivalencia_ml;

          const stockAnterior = item.stock_unidades;
          const stockNuevo = stockAnterior - aDescontarEnUnidades;

          await connection.query(
            "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
            [stockNuevo, item.id]
          );

          await connection.query(
            `INSERT INTO stock_movements (item_id, tipo_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo, descripcion) VALUES (?, 'VENTA', ?, ?, ?, ?)`,
            [
              item.id,
              -aDescontarEnUnidades,
              stockAnterior,
              stockNuevo,
              `Venta: ${cantidadVendida}x ${productoVendido}`,
            ]
          );

          consumoTotalMl -= aDescontarDeEsteItemEnMl;
        }

        if (consumoTotalMl > 0.01) {
          // Pequeño margen de error para decimales
          throw new Error(
            `Stock insuficiente para procesar la venta de "${productoVendido}".`
          );
        }
      }
    }

    await connection.commit();
    res.status(200).json({ message: "Ventas procesadas y stock actualizado." });
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
