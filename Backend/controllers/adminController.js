import pool from "../config/db.js";

// --- GESTIÓN DE CATEGORÍAS ---
export const getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM categorias ORDER BY nombre ASC"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error del servidor" });
  }
};

export const createCategory = async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) {
    return res.status(400).json({ message: "El nombre es obligatorio." });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO categorias (nombre) VALUES (?)",
      [nombre]
    );
    res
      .status(201)
      .json({ message: "Categoría creada con éxito.", newId: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Esa categoría ya existe." });
    }
    res.status(500).json({ message: "Error del servidor" });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM categorias WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Categoría no encontrada." });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error del servidor." });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ message: "El nombre es obligatorio." });
    }
    await pool.query("UPDATE categorias SET nombre = ? WHERE id = ?", [
      nombre,
      id,
    ]);
    res.status(200).json({ message: "Categoría actualizada con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar la categoría." });
  }
};

// --- GESTIÓN DE MARCAS ---
export const getMarcas = async (req, res) => {
  try {
    const query = `
            SELECT m.id, m.nombre, c.nombre as categoria_nombre 
            FROM marcas AS m
            JOIN categorias AS c ON m.categoria_id = c.id
            ORDER BY m.nombre ASC
        `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error del servidor" });
  }
};

export const createMarca = async (req, res) => {
  const { nombre, categoria_id } = req.body;
  if (!nombre || !categoria_id) {
    return res
      .status(400)
      .json({ message: "Nombre y categoría son obligatorios." });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO marcas (nombre, categoria_id) VALUES (?, ?)",
      [nombre, categoria_id]
    );
    res
      .status(201)
      .json({ message: "Marca creada con éxito.", newId: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Esa marca ya existe." });
    }
    res.status(500).json({ message: "Error del servidor" });
  }
};

export const getMarcaById = async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query("SELECT * FROM marcas WHERE id = ?", [id]);
  if (rows.length === 0)
    return res.status(404).json({ message: "Marca no encontrada." });
  res.json(rows[0]);
};

export const updateMarca = async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria_id } = req.body;
  await pool.query(
    "UPDATE marcas SET nombre = ?, categoria_id = ? WHERE id = ?",
    [nombre, categoria_id, id]
  );
  res.status(200).json({ message: "Marca actualizada con éxito." });
};

// --- GESTIÓN DE ITEMS DE STOCK ---
export const createStockItem = async (req, res) => {
  const {
    marca_id,
    equivalencia_ml,
    stock_unidades,
    prioridad_consumo,
    alerta_stock_bajo,
  } = req.body;

  if (!marca_id || !equivalencia_ml || !alerta_stock_bajo) {
    return res.status(400).json({ message: "Faltan datos obligatorios." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO stock_items (marca_id, equivalencia_ml, stock_unidades, prioridad_consumo, alerta_stock_bajo) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        marca_id,
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
    res.status(500).json({ message: "Error al crear el item." });
  } finally {
    connection.release();
  }
};

export const getStockItemById = async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query("SELECT * FROM stock_items WHERE id = ?", [
    id,
  ]);
  if (rows.length === 0)
    return res.status(404).json({ message: "Item no encontrado." });
  res.json(rows[0]);
};

export const updateStockItem = async (req, res) => {
  const { id } = req.params;
  const { marca_id, equivalencia_ml, prioridad_consumo, alerta_stock_bajo } =
    req.body;
  await pool.query(
    "UPDATE stock_items SET marca_id = ?, equivalencia_ml = ?, prioridad_consumo = ?, alerta_stock_bajo = ? WHERE id = ?",
    [marca_id, equivalencia_ml, prioridad_consumo, alerta_stock_bajo, id]
  );
  res.status(200).json({ message: "Item de stock actualizado con éxito." });
};

// --- GESTIÓN DE PRODUCTOS Y RECETAS ---
export const getProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM productos ORDER BY nombre_producto_fudo ASC"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error del servidor" });
  }
};

export const createRecipe = async (req, res) => {
  const { nombre_producto_fudo, reglas } = req.body;
  if (
    !nombre_producto_fudo ||
    !reglas ||
    !Array.isArray(reglas) ||
    reglas.length === 0
  ) {
    return res.status(400).json({
      message: "El nombre del producto y las reglas son obligatorios.",
    });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [productResult] = await connection.query(
      "INSERT INTO productos (nombre_producto_fudo) VALUES (?)",
      [nombre_producto_fudo]
    );
    const newProductId = productResult.insertId;

    for (const regla of reglas) {
      const { marca_id, item_id, consumo_ml, prioridad_item } = regla;
      if (!marca_id || !item_id || !consumo_ml || !prioridad_item) {
        throw new Error("Una regla de la receta está incompleta.");
      }
      await connection.query(
        `INSERT INTO recetas (producto_id, marca_id, item_id, consumo_ml, prioridad_item)
         VALUES (?, ?, ?, ?, ?)`,
        [newProductId, marca_id, item_id, consumo_ml, prioridad_item]
      );
    }

    await connection.commit();
    res.status(201).json({ message: "Producto y receta creados con éxito." });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: `El producto "${nombre_producto_fudo}" ya existe.` });
    }
    res
      .status(500)
      .json({ message: "Error al guardar la receta.", error: error.message });
  } finally {
    connection.release();
  }
};

export const getRecipeById = async (req, res) => {
  const { id } = req.params; // id del producto
  const [productRows] = await pool.query(
    "SELECT * FROM productos WHERE id = ?",
    [id]
  );
  if (productRows.length === 0)
    return res.status(404).json({ message: "Producto no encontrado." });

  const [recipeRows] = await pool.query(
    "SELECT * FROM recetas WHERE producto_id = ?",
    [id]
  );
  res.json({ product: productRows[0], reglas: recipeRows });
};

export const updateRecipe = async (req, res) => {
  const { id } = req.params; // id del producto
  const { nombre_producto_fudo, reglas } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      "UPDATE productos SET nombre_producto_fudo = ? WHERE id = ?",
      [nombre_producto_fudo, id]
    );
    await connection.query("DELETE FROM recetas WHERE producto_id = ?", [id]);

    for (const regla of reglas) {
      await connection.query(
        "INSERT INTO recetas (producto_id, marca_id, item_id, consumo_ml, prioridad_item) VALUES (?, ?, ?, ?, ?)",
        [
          id,
          regla.marca_id,
          regla.item_id,
          regla.consumo_ml,
          regla.prioridad_item,
        ]
      );
    }
    await connection.commit();
    res.status(200).json({ message: "Receta actualizada con éxito." });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: "Error al actualizar la receta." });
  } finally {
    connection.release();
  }
};
