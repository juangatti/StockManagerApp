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

export const createRecipe = async (req, res) => {
  // Ahora esperamos: { nombre_producto_fudo: "Cuba Libre", reglas: [ ... ] }
  const { nombre_producto_fudo, reglas } = req.body;

  if (
    !nombre_producto_fudo ||
    !reglas ||
    !Array.isArray(reglas) ||
    reglas.length === 0
  ) {
    return res.status(400).json({
      message: "El nombre del producto y al menos una regla son obligatorios.",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Crear el nuevo producto en la tabla `productos`
    const [productResult] = await connection.query(
      "INSERT INTO productos (nombre_producto_fudo) VALUES (?)",
      [nombre_producto_fudo]
    );
    const newProductId = productResult.insertId; // Obtenemos el ID del producto recién creado

    // 2. Insertar cada una de las reglas de la receta usando el nuevo ID
    for (const regla of reglas) {
      const { ingrediente_id, item_id, consumo_ml, prioridad_item } = regla;
      if (!ingrediente_id || !item_id || !consumo_ml || !prioridad_item) {
        throw new Error(
          "Una de las reglas de la receta tiene datos faltantes."
        );
      }

      await connection.query(
        `INSERT INTO recetas (producto_id, ingrediente_id, item_id, consumo_ml, prioridad_item)
         VALUES (?, ?, ?, ?, ?)`,
        [newProductId, ingrediente_id, item_id, consumo_ml, prioridad_item]
      );
    }

    await connection.commit();
    res.status(201).json({
      message: `Producto "${nombre_producto_fudo}" y su receta fueron creados con éxito.`,
    });
  } catch (error) {
    await connection.rollback();
    // Manejo de error específico si el producto ya existe
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: `El producto "${nombre_producto_fudo}" ya existe.` });
    }
    console.error("Error al crear la receta:", error);
    res
      .status(500)
      .json({ message: "Error al guardar la receta.", error: error.message });
  } finally {
    connection.release();
  }
};

export const getProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre_producto_fudo FROM productos ORDER BY nombre_producto_fudo ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};
