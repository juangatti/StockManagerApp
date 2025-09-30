// Importamos el pool de la base de datos que crearemos en /config/db.js
import pool from "../config/db.js";

// Controlador para GET /api/stock
export const getStock = async (req, res) => {
  try {
    const query = `
      SELECT 
        si.id,
        si.nombre_item,
        si.stock_unidades,
        si.equivalencia_ml,
        si.prioridad_consumo,
        i.nombre AS ingrediente_padre 
      FROM stock_items AS si
      JOIN ingredientes AS i ON si.ingrediente_id = i.id
      ORDER BY i.nombre, si.prioridad_consumo;
    `;

    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error al consultar el stock", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Controlador para GET /api/stock/totales
export const getStockTotals = async (req, res) => {
  try {
    const query = `
      SELECT
        CASE
          WHEN i.agrupar_totales = TRUE THEN i.nombre
          ELSE si.nombre_item
        END AS display_nombre,
        SUM(si.stock_unidades * si.equivalencia_ml) / 1000 AS total_litros
      FROM stock_items AS si
      JOIN ingredientes AS i ON si.ingrediente_id = i.id
      GROUP BY display_nombre
      ORDER BY display_nombre;
    `;
    const queryResult = await pool.query(query);
    const rows = queryResult[0];
    res.json(rows);
  } catch (error) {
    console.error("Error al calcular los totales", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Controlador para POST /api/stock/compras
export const registerPurchase = async (req, res) => {
  const itemsComprados = req.body;

  if (
    !itemsComprados ||
    !Array.isArray(itemsComprados) ||
    itemsComprados.length === 0
  ) {
    return res
      .status(400)
      .json({ message: "Datos de la compra inválidos o vacíos." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const item of itemsComprados) {
      const [stockActualRows] = await connection.query(
        "SELECT stock_unidades FROM stock_items WHERE id = ?",
        [item.itemId]
      );
      if (stockActualRows.length === 0) {
        throw new Error(`El item con ID ${item.itemId} no fue encontrado.`);
      }
      const stockAnterior = stockActualRows[0].stock_unidades;
      const stockNuevo = stockAnterior + item.cantidad;

      await connection.query(
        "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
        [stockNuevo, item.itemId]
      );

      await connection.query(
        `INSERT INTO stock_movements 
         (item_id, tipo_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo, descripcion) 
         VALUES (?, 'COMPRA', ?, ?, ?, ?)`,
        [
          item.itemId,
          item.cantidad,
          stockAnterior,
          stockNuevo,
          item.descripcion || "Compra",
        ]
      );
    }

    await connection.commit();
    res.status(200).json({
      message: "Compra registrada y stock actualizado correctamente.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al registrar la compra:", error);
    res
      .status(500)
      .json({ message: "Error al registrar la compra.", error: error.message });
  } finally {
    connection.release();
  }
};

// Controlador para POST /api/stock/ajuste
export const registerAdjustment = async (req, res) => {
  const { itemId, conteoReal, descripcion } = req.body;

  if (itemId === undefined || conteoReal === undefined) {
    return res
      .status(400)
      .json({ message: "Faltan datos para el ajuste (itemId, conteoReal)." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [stockActualRows] = await connection.query(
      "SELECT stock_unidades FROM stock_items WHERE id = ? FOR UPDATE",
      [itemId]
    );
    if (stockActualRows.length === 0) {
      throw new Error(`El item con ID ${itemId} no fue encontrado.`);
    }
    const stockAnterior = stockActualRows[0].stock_unidades;

    const cantidadMovida = conteoReal - stockAnterior;

    if (cantidadMovida !== 0) {
      await connection.query(
        "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
        [conteoReal, itemId]
      );

      await connection.query(
        `INSERT INTO stock_movements 
             (item_id, tipo_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo, descripcion) 
             VALUES (?, 'AJUSTE', ?, ?, ?, ?)`,
        [
          itemId,
          cantidadMovida,
          stockAnterior,
          conteoReal,
          descripcion || "Ajuste por conteo físico",
        ]
      );
    }

    await connection.commit();
    res.status(200).json({
      message: `Ajuste registrado. Se movieron ${cantidadMovida.toFixed(
        2
      )} unidades.`,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al registrar el ajuste:", error);
    res
      .status(500)
      .json({ message: "Error al registrar el ajuste.", error: error.message });
  } finally {
    connection.release();
  }
};
