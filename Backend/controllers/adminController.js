import pool from "../config/db.js";

export const getIngredients = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM ingredientes ORDER BY nombre ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener ingredientes:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// POST /api/admin/ingredients - Crea un nuevo ingrediente
export const createIngredient = async (req, res) => {
  const { nombre, agrupar_totales } = req.body;
  if (!nombre) {
    return res.status(400).json({ message: "El nombre es obligatorio." });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO ingredientes (nombre, agrupar_totales) VALUES (?, ?)",
      [nombre, agrupar_totales === false ? false : true] // Por defecto es true
    );
    res.status(201).json({
      message: "Ingrediente creado con éxito.",
      newId: result.insertId,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Ese ingrediente ya existe." });
    }
    console.error("Error al crear ingrediente:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};

// --- CONTROLADOR PARA ITEMS DE STOCK (El que ya habíamos planeado) ---

// POST /api/admin/stock-items - Crea un nuevo item de stock
export const createStockItem = async (req, res) => {
  const {
    nombre_item,
    ingrediente_id,
    equivalencia_ml,
    stock_unidades,
    prioridad_consumo,
    alerta_stock_bajo,
  } = req.body;

  if (
    !nombre_item ||
    !ingrediente_id ||
    !equivalencia_ml ||
    !alerta_stock_bajo
  ) {
    return res.status(400).json({ message: "Faltan datos obligatorios." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO stock_items (nombre_item, ingrediente_id, equivalencia_ml, stock_unidades, prioridad_consumo, alerta_stock_bajo) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre_item,
        ingrediente_id,
        equivalencia_ml,
        stock_unidades || 0,
        prioridad_consumo || 1,
        alerta_stock_bajo,
      ]
    );
    const newItemId = result.insertId;

    if (stock_unidades && stock_unidades > 0) {
      await connection.query(
        `INSERT INTO stock_movements (item_id, tipo_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo, descripcion) 
         VALUES (?, 'AJUSTE', ?, ?, ?, ?)`,
        [
          newItemId,
          stock_unidades,
          0,
          stock_unidades,
          "Stock inicial al crear item",
        ]
      );
    }

    await connection.commit();
    res
      .status(201)
      .json({ message: "Item de stock creado con éxito.", newItemId });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: `El item "${nombre_item}" ya existe.` });
    }
    console.error("Error al crear el item:", error);
    res.status(500).json({ message: "Error al crear el item." });
  } finally {
    connection.release();
  }
};
