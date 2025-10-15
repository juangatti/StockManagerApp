// Importamos el pool de la base de datos que crearemos en /config/db.js
import pool from "../config/db.js";

// Controlador para GET /api/stock
export const getStock = async (req, res) => {
  try {
    const query = `
      SELECT 
        si.id,
        m.nombre AS nombre_marca,
        c.nombre AS nombre_categoria,
        si.equivalencia_ml,
        si.stock_unidades,
        m.id as marca_id
        -- Se eliminó 'si.prioridad_consumo' de la consulta
      FROM stock_items AS si
      JOIN marcas AS m ON si.marca_id = m.id
      JOIN categorias AS c ON m.categoria_id = c.id
      
      ORDER BY c.nombre, m.nombre, si.equivalencia_ml;
    `;
    const [rows] = await pool.query(query);
    const stockConNombreCompleto = rows.map((item) => ({
      ...item,
      nombre_completo: `${item.nombre_marca} ${item.equivalencia_ml}ml`,
    }));
    res.json(stockConNombreCompleto);
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
        m.nombre AS display_nombre,
        SUM(si.stock_unidades * si.equivalencia_ml) / 1000 AS total_litros
      FROM stock_items AS si
      JOIN marcas AS m ON si.marca_id = m.id
      GROUP BY m.nombre
      ORDER BY m.nombre;
    `;
    const [rows] = await pool.query(query);
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

export const registerMassiveAdjustment = async (req, res) => {
  // Esperamos un array de ajustes, ej: [{ itemId: 1, conteoReal: 12.0 }, { itemId: 2, conteoReal: 8.5 }]
  const ajustes = req.body;

  if (!ajustes || !Array.isArray(ajustes) || ajustes.length === 0) {
    return res
      .status(400)
      .json({ message: "No se proporcionaron datos para el ajuste." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const ajuste of ajustes) {
      const { itemId, conteoReal } = ajuste;

      const [stockActualRows] = await connection.query(
        "SELECT stock_unidades FROM stock_items WHERE id = ? FOR UPDATE",
        [itemId]
      );

      if (stockActualRows.length === 0) {
        throw new Error(`Item con ID ${itemId} no encontrado.`);
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
            ajuste.descripcion || "Ajuste por conteo masivo",
          ]
        );
      }
    }

    await connection.commit();
    res.status(200).json({ message: "Ajuste masivo registrado con éxito." });
  } catch (error) {
    await connection.rollback();
    console.error("Error en el ajuste masivo:", error);
    res
      .status(500)
      .json({ message: "Error en el ajuste masivo.", error: error.message });
  } finally {
    connection.release();
  }
};

export const getStockMovements = async (req, res) => {
  try {
    // Consulta SQL corregida
    const query = `
      SELECT 
        sm.id,
        sm.tipo_movimiento,
        sm.cantidad_unidades_movidas,
        sm.stock_anterior,
        sm.stock_nuevo,
        sm.descripcion,
        sm.fecha_movimiento,
        CONCAT(m.nombre, ' ', si.equivalencia_ml, 'ml') AS nombre_item
      FROM stock_movements AS sm
      JOIN stock_items AS si ON sm.item_id = si.id
      JOIN marcas AS m ON si.marca_id = m.id
      ORDER BY sm.fecha_movimiento DESC
      LIMIT 100;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error al consultar movimientos de stock:", error);
    res.status(500).json({
      message: "Error al consultar movimientos de stock.",
      error: error.message,
    });
  }
};

export const getPrebatches = async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        nombre_prebatch,
        fecha_produccion,
        cantidad_actual_ml,
        -- Calculamos el estado basado en la fecha de producción
        CASE
          WHEN CURDATE() >= DATE_ADD(fecha_produccion, INTERVAL 28 DAY) THEN 'VENCIDO'
          WHEN CURDATE() >= DATE_ADD(fecha_produccion, INTERVAL 14 DAY) THEN 'ADVERTENCIA'
          ELSE 'FRESCO'
        END AS estado
      FROM prebatches
      WHERE cantidad_actual_ml > 0
      ORDER BY fecha_produccion ASC;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener prebatches:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getPrebatchTotals = async (req, res) => {
  try {
    const query = `
      SELECT
        nombre_prebatch,
        SUM(cantidad_actual_ml) / 1000 AS total_litros
      FROM prebatches
      GROUP BY nombre_prebatch
      ORDER BY nombre_prebatch;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener totales de prebatches:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getIceReport = async (req, res) => {
  try {
    // CORRECCIÓN: Usamos UPPER() para hacer la comparación insensible a mayúsculas/minúsculas.
    const query = `
      SELECT 
        m.nombre AS nombre_marca, 
        si.stock_unidades 
      FROM stock_items si
      JOIN marcas m ON si.marca_id = m.id
      JOIN categorias c ON m.categoria_id = c.id
      WHERE UPPER(c.nombre) = 'HIELO';
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error al generar el Informe Hielístico:", error);
    res.status(500).json({
      message: "Error al generar el Informe Hielístico.",
      error: error.message,
    });
  }
};

export const getStockAlerts = async (req, res) => {
  try {
    const lowStockQuery = `
            SELECT si.id, m.nombre as nombre_marca, si.equivalencia_ml, si.stock_unidades, si.alerta_stock_bajo
            FROM stock_items si
            JOIN marcas m ON si.marca_id = m.id
            WHERE si.stock_unidades > 0 AND si.stock_unidades <= si.alerta_stock_bajo;
        `;
    const [lowStockItems] = await pool.query(lowStockQuery);

    const outOfStockQuery = `
            SELECT si.id, m.nombre as nombre_marca, si.equivalencia_ml, si.stock_unidades
            FROM stock_items si
            JOIN marcas m ON si.marca_id = m.id
            WHERE si.stock_unidades <= 0;
        `;
    const [outOfStockItems] = await pool.query(outOfStockQuery);

    const formatItems = (items) =>
      items.map((item) => ({
        ...item,
        nombre_item: `${item.nombre_marca} ${item.equivalencia_ml}ml`,
      }));

    res.json({
      lowStock: formatItems(lowStockItems),
      outOfStock: formatItems(outOfStockItems),
    });
  } catch (error) {
    console.error("Error al obtener alertas de stock:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
