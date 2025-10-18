import pool from "../config/db.js";

// --- GESTIÓN DE CATEGORÍAS ---
export const getCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15; // 15 categorías por página
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereClause = "WHERE is_active = TRUE";
    const queryParams = [];

    if (searchQuery) {
      whereClause += " AND nombre LIKE ?";
      queryParams.push(`%${searchQuery}%`);
    }

    // 1. Consulta de Conteo
    const countQuery = `SELECT COUNT(id) AS totalCategories FROM categorias ${whereClause};`;
    const [countRows] = await pool.query(countQuery, queryParams);
    const totalCategories = countRows[0].totalCategories;
    const totalPages = Math.ceil(totalCategories / limit);

    // 2. Consulta de Datos Paginados
    const dataQuery = `
      SELECT * FROM categorias 
      ${whereClause} 
      ORDER BY nombre ASC 
      LIMIT ? 
      OFFSET ?;
    `;
    const dataParams = [...queryParams, limit, offset];
    const [categories] = await pool.query(dataQuery, dataParams);

    // 3. Respuesta estructurada
    res.json({
      categories,
      pagination: {
        currentPage: page,
        totalPages,
        totalCategories,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error del servidor" });
  }
};

export const getInactiveCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereClause = "WHERE is_active = FALSE";
    const queryParams = [];

    if (searchQuery) {
      whereClause += " AND nombre LIKE ?";
      queryParams.push(`%${searchQuery}%`);
    }

    // 1. Consulta de Conteo
    const countQuery = `SELECT COUNT(id) AS totalCategories FROM categorias ${whereClause};`;
    const [countRows] = await pool.query(countQuery, queryParams);
    const totalCategories = countRows[0].totalCategories;
    const totalPages = Math.ceil(totalCategories / limit);

    // 2. Consulta de Datos Paginados
    const dataQuery = `
      SELECT * FROM categorias 
      ${whereClause} 
      ORDER BY nombre ASC 
      LIMIT ? 
      OFFSET ?;
    `;
    const dataParams = [...queryParams, limit, offset];
    const [categories] = await pool.query(dataQuery, dataParams);

    // 3. Respuesta estructurada
    res.json({
      categories,
      pagination: {
        currentPage: page,
        totalPages,
        totalCategories,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error del servidor." });
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

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE categorias SET is_active = FALSE WHERE id = ?", [
      id,
    ]);
    res.status(200).json({ message: "Categoría desactivada con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al desactivar la categoría." });
  }
};

export const restoreCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE categorias SET is_active = TRUE WHERE id = ?", [
      id,
    ]);
    res.status(200).json({ message: "Categoría restaurada con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al restaurar la categoría." });
  }
};

// --- GESTIÓN DE MARCAS ---
export const getMarcas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15; // 15 marcas por página
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereClause = "WHERE m.is_active = TRUE";
    const queryParams = [];

    if (searchQuery) {
      whereClause += " AND m.nombre LIKE ?"; // Buscamos por nombre de marca
      queryParams.push(`%${searchQuery}%`);
    }

    // 1. Consulta de Conteo
    const countQuery = `
      SELECT COUNT(m.id) AS totalMarcas
      FROM marcas AS m
      ${whereClause};
    `;
    const [countRows] = await pool.query(countQuery, queryParams);
    const totalMarcas = countRows[0].totalMarcas;
    const totalPages = Math.ceil(totalMarcas / limit);

    // 2. Consulta de Datos Paginados
    const dataQuery = `
      SELECT m.id, m.nombre, c.nombre as categoria_nombre, m.categoria_id 
      FROM marcas AS m
      JOIN categorias AS c ON m.categoria_id = c.id
      ${whereClause}
      ORDER BY m.nombre ASC
      LIMIT ?
      OFFSET ?;
    `;
    const dataParams = [...queryParams, limit, offset];
    const [marcas] = await pool.query(dataQuery, dataParams);

    // 3. Respuesta estructurada
    res.json({
      marcas,
      pagination: {
        currentPage: page,
        totalPages,
        totalMarcas,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error del servidor" });
  }
};

export const getInactiveMarcas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereClause = "WHERE is_active = FALSE"; // Cambiamos a FALSE
    const queryParams = [];

    if (searchQuery) {
      whereClause += " AND nombre LIKE ?";
      queryParams.push(`%${searchQuery}%`);
    }

    // 1. Consulta de Conteo
    const countQuery = `SELECT COUNT(id) AS totalMarcas FROM marcas ${whereClause};`;
    const [countRows] = await pool.query(countQuery, queryParams);
    const totalMarcas = countRows[0].totalMarcas;
    const totalPages = Math.ceil(totalMarcas / limit);

    // 2. Consulta de Datos Paginados
    const dataQuery = `
      SELECT * FROM marcas 
      ${whereClause} 
      ORDER BY nombre ASC 
      LIMIT ? 
      OFFSET ?;
    `; // No necesitamos join para inactivas por ahora
    const dataParams = [...queryParams, limit, offset];
    const [marcas] = await pool.query(dataQuery, dataParams);

    // 3. Respuesta estructurada
    res.json({
      marcas,
      pagination: {
        currentPage: page,
        totalPages,
        totalMarcas,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error del servidor." });
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

export const deleteMarca = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE marcas SET is_active = FALSE WHERE id = ?", [id]);
    res.status(200).json({ message: "Marca desactivada con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al desactivar la marca." });
  }
};

export const restoreMarca = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE marcas SET is_active = TRUE WHERE id = ?", [id]);
    res.status(200).json({ message: "Categoría restaurada con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al restaurar la categoría." });
  }
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

export const getActiveStockItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15; // 15 items por página
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereClause = "WHERE si.is_active = TRUE";
    const queryParams = [];

    if (searchQuery) {
      // Buscamos en nombre de marca o categoría
      whereClause += " AND (m.nombre LIKE ? OR c.nombre LIKE ?)";
      queryParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    // 1. Consulta de Conteo
    const countQuery = `
      SELECT COUNT(si.id) AS totalItems
      FROM stock_items AS si
      JOIN marcas AS m ON si.marca_id = m.id
      JOIN categorias AS c ON m.categoria_id = c.id
      ${whereClause};
    `;
    const [countRows] = await pool.query(countQuery, queryParams);
    const totalItems = countRows[0].totalItems;
    const totalPages = Math.ceil(totalItems / limit);

    // 2. Consulta de Datos Paginados
    const dataQuery = `
     SELECT 
        si.id,
        m.nombre AS nombre_marca,
        c.nombre AS nombre_categoria,
        si.equivalencia_ml,
        si.stock_unidades,
        m.id as marca_id,
        si.prioridad_consumo,  -- Añadido para el form
        si.alerta_stock_bajo -- Añadido para el form
      FROM stock_items AS si
      JOIN marcas AS m ON si.marca_id = m.id
      JOIN categorias AS c ON m.categoria_id = c.id
      ${whereClause}
      ORDER BY c.nombre, m.nombre, si.equivalencia_ml
      LIMIT ?
      OFFSET ?;
    `;
    const dataParams = [...queryParams, limit, offset];
    const [items] = await pool.query(dataQuery, dataParams);

    const stockConNombreCompleto = items.map((item) => ({
      ...item,
      nombre_completo: `${item.nombre_marca} ${item.equivalencia_ml}ml`,
    }));

    // 3. Respuesta estructurada
    res.json({
      items: stockConNombreCompleto,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching active stock items:", error);
    res.status(500).json({
      message: "Error del servidor al obtener items de stock activos.",
    });
  }
};

export const getInactiveStockItem = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereClause = "WHERE si.is_active = FALSE"; // Cambiado a FALSE
    const queryParams = [];

    if (searchQuery) {
      // Buscamos en nombre de marca o categoría también para inactivos
      whereClause += " AND (m.nombre LIKE ? OR c.nombre LIKE ?)";
      queryParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    // 1. Consulta de Conteo
    const countQuery = `
        SELECT COUNT(si.id) AS totalItems 
        FROM stock_items si 
        JOIN marcas m ON si.marca_id = m.id 
        JOIN categorias c ON m.categoria_id = c.id 
        ${whereClause};
    `;
    const [countRows] = await pool.query(countQuery, queryParams);
    const totalItems = countRows[0].totalItems;
    const totalPages = Math.ceil(totalItems / limit);

    // 2. Consulta de Datos Paginados
    const dataQuery = `
      SELECT si.id, m.nombre AS nombre_marca, si.equivalencia_ml, c.nombre AS nombre_categoria
      FROM stock_items si 
      JOIN marcas m ON si.marca_id = m.id 
      JOIN categorias c ON m.categoria_id = c.id 
      ${whereClause} 
      ORDER BY m.nombre ASC 
      LIMIT ? 
      OFFSET ?;
    `;
    const dataParams = [...queryParams, limit, offset];
    const [items] = await pool.query(dataQuery, dataParams);

    const stockConNombreCompleto = items.map((item) => ({
      ...item,
      nombre_completo: `${item.nombre_marca} ${item.equivalencia_ml}ml`,
    }));

    // 3. Respuesta estructurada
    res.json({
      items: stockConNombreCompleto, // Cambiado a 'items' por consistencia
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error del servidor." });
  }
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

export const deleteStockItem = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE stock_items SET is_active = FALSE WHERE id = ?", [
      id,
    ]);
    res.status(200).json({ message: "Item de stock desactivado con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al desactivar el item." });
  }
};

export const restoreStockItem = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE stock_items SET is_active = TRUE WHERE id = ?", [
      id,
    ]);
    res.status(200).json({ message: "Categoría restaurada con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al restaurar la categoría." });
  }
};

// --- GESTIÓN DE PRODUCTOS Y RECETAS ---
export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15; // 15 productos por página
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereClause = "WHERE is_active = TRUE";
    const queryParams = [];

    if (searchQuery) {
      whereClause += " AND nombre_producto_fudo LIKE ?";
      queryParams.push(`%${searchQuery}%`);
    }

    // 1. Consulta de Conteo
    const countQuery = `SELECT COUNT(id) AS totalProducts FROM productos ${whereClause};`;
    const [countRows] = await pool.query(countQuery, queryParams);
    const totalProducts = countRows[0].totalProducts;
    const totalPages = Math.ceil(totalProducts / limit);

    // 2. Consulta de Datos Paginados
    const dataQuery = `
      SELECT * FROM productos 
      ${whereClause} 
      ORDER BY nombre_producto_fudo ASC 
      LIMIT ? 
      OFFSET ?;
    `;
    const dataParams = [...queryParams, limit, offset];
    const [products] = await pool.query(dataQuery, dataParams);

    // 3. Respuesta estructurada
    res.json({
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error del servidor" });
  }
};

export const getInactiveProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereClause = "WHERE is_active = FALSE"; // Cambiado a FALSE
    const queryParams = [];

    if (searchQuery) {
      whereClause += " AND nombre_producto_fudo LIKE ?";
      queryParams.push(`%${searchQuery}%`);
    }

    // 1. Consulta de Conteo
    const countQuery = `SELECT COUNT(id) AS totalProducts FROM productos ${whereClause};`;
    const [countRows] = await pool.query(countQuery, queryParams);
    const totalProducts = countRows[0].totalProducts;
    const totalPages = Math.ceil(totalProducts / limit);

    // 2. Consulta de Datos Paginados
    const dataQuery = `
      SELECT * FROM productos 
      ${whereClause} 
      ORDER BY nombre_producto_fudo ASC 
      LIMIT ? 
      OFFSET ?;
    `;
    const dataParams = [...queryParams, limit, offset];
    const [products] = await pool.query(dataQuery, dataParams);

    // 3. Respuesta estructurada
    res.json({
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error del servidor." });
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

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // Solo necesitamos desactivar el producto. La receta puede quedar por si se reactiva.
    await pool.query("UPDATE productos SET is_active = FALSE WHERE id = ?", [
      id,
    ]);
    res.status(200).json({ message: "Producto desactivado con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al desactivar el producto." });
  }
};

export const restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE productos SET is_active = TRUE WHERE id = ?", [
      id,
    ]);
    res.status(200).json({ message: "Categoría restaurada con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al restaurar la categoría." });
  }
};
