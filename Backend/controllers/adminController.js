import pool from "../config/db.js";
import { buildNombreCompleto } from "../utils/helpers.js"; //
import bcrypt from "bcryptjs";

///prueba

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

export const getAllActiveCategories = async (req, res) => {
  try {
    const query = `
      SELECT id, nombre 
      FROM categorias 
      WHERE is_active = TRUE 
      ORDER BY nombre ASC;
    `;
    const [rows] = await pool.query(query);
    res.json(rows); // Devuelve directamente el array de categorías
  } catch (error) {
    console.error("Error fetching all active categories:", error);
    res.status(500).json({
      message: "Error del servidor al obtener todas las categorías activas.",
    });
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
      [nombre],
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
export const getAllActiveMarcas = async (req, res) => {
  try {
    const query = `
      SELECT id, nombre 
      FROM marcas 
      WHERE is_active = TRUE 
      ORDER BY nombre ASC;
    `;
    const [rows] = await pool.query(query);
    res.json(rows); // Devuelve directamente el array de marcas
  } catch (error) {
    console.error("Error fetching all active marcas:", error);
    res.status(500).json({
      message: "Error del servidor al obtener todas las marcas activas.",
    });
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
      [nombre, categoria_id],
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
    [nombre, categoria_id, id],
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
    variacion,
    cantidad_por_envase, // <-- Nuevo nombre
    unidad_medida, // <-- Nueva columna
    stock_unidades,
    alerta_stock_bajo,
  } = req.body;

  // Validación
  if (
    !marca_id ||
    !cantidad_por_envase ||
    !unidad_medida ||
    !alerta_stock_bajo ||
    !["ml", "g"].includes(unidad_medida)
  ) {
    return res.status(400).json({
      message:
        "Faltan datos obligatorios o la unidad de medida es inválida ('ml' o 'g').",
    });
  }

  const connection = await pool.getConnection(); //
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      // Query actualizada
      `INSERT INTO stock_items (marca_id, variacion, cantidad_por_envase, unidad_medida, stock_unidades, alerta_stock_bajo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        marca_id,
        variacion || null,
        cantidad_por_envase,
        unidad_medida, // Guardar 'ml' o 'g'
        stock_unidades || 0,
        alerta_stock_bajo,
      ],
    );
    const newItemId = result.insertId;

    // Lógica de stock inicial (sin cambios)
    if (stock_unidades && stock_unidades > 0) {
      await connection.query(
        `INSERT INTO stock_movements (item_id, tipo_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo, description)
           VALUES (?, 'AJUSTE', ?, ?, ?, ?)`,
        [
          newItemId,
          stock_unidades,
          0,
          stock_unidades,
          "Stock inicial al crear item",
        ],
      );
    }

    await connection.commit();
    res
      .status(201)
      .json({ message: "Item de stock creado con éxito.", newItemId });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "Ya existe un item con esa marca, variación, cantidad y unidad.",
      }); // Mensaje más específico
    }
    console.error("Error creating stock item:", error); // Loggear error
    res
      .status(500)
      .json({ message: "Error al crear el item.", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const getStockItemById = async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    //
    "SELECT *, cantidad_por_envase, unidad_medida FROM stock_items WHERE id = ?",
    [id],
  );
  if (rows.length === 0)
    return res.status(404).json({ message: "Item no encontrado." });
  res.json(rows[0]);
};

export const getAllActiveStockItemsForAdjustment = async (req, res) => {
  try {
    const query = `
     SELECT
        si.id,
        -- Construcción dinámica del nombre completo con unidad
        CONCAT(
            m.nombre,
            CASE WHEN si.variacion IS NOT NULL AND si.variacion != '' THEN CONCAT(' ', si.variacion) ELSE '' END,
            ' ',
            FORMAT(si.cantidad_por_envase, IF(si.cantidad_por_envase = FLOOR(si.cantidad_por_envase), 0, 2)), -- Formatear número
            si.unidad_medida -- Añadir unidad
        ) AS nombre_completo,
        si.stock_unidades,
        si.unidad_medida -- Enviar unidad por si el frontend la necesita
      FROM stock_items AS si
      JOIN marcas AS m ON si.marca_id = m.id
      WHERE si.is_active = TRUE
      ORDER BY nombre_completo ASC;
    `;
    const [rows] = await pool.query(query); //
    res.json(rows);
  } catch (error) {
    /* ... (manejo de error sin cambios) ... */
    console.error(
      "Error fetching all active stock items for adjustment:",
      error,
    );
    res
      .status(500)
      .json({ message: "Error del servidor al obtener items para ajuste." });
  }
};

export const getActiveStockItems = async (req, res) => {
  try {
    // ... (paginación y búsqueda sin cambios, buscar por variacion ya estaba) ...
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;
    let whereClause = "WHERE si.is_active = TRUE";
    const queryParams = [];
    if (searchQuery) {
      whereClause +=
        " AND (m.nombre LIKE ? OR c.nombre LIKE ? OR si.variacion LIKE ?)";
      queryParams.push(
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        `%${searchQuery}%`,
      );
    }

    // Consulta de Conteo (sin cambios)
    const countQuery = `
  SELECT COUNT(si.id) AS totalItems
  FROM stock_items AS si
  JOIN marcas AS m ON si.marca_id = m.id
  JOIN categorias AS c ON m.categoria_id = c.id
  ${whereClause};
`;
    const [countRows] = await pool.query(countQuery, queryParams); //
    const totalItems = countRows[0].totalItems;
    const totalPages = Math.ceil(totalItems / limit);

    // Consulta de Datos Paginados
    const dataQuery = `
     SELECT
        si.id,
        m.nombre AS nombre_marca,
        c.nombre AS nombre_categoria,
        si.variacion,
        si.cantidad_por_envase, -- <-- Nueva
        si.unidad_medida,       -- <-- Nueva
        si.stock_unidades,
        m.id as marca_id,
        si.alerta_stock_bajo,
        -- Construcción dinámica del nombre completo con unidad
        CONCAT(
            m.nombre,
            CASE WHEN si.variacion IS NOT NULL AND si.variacion != '' THEN CONCAT(' ', si.variacion) ELSE '' END,
            ' ',
             FORMAT(si.cantidad_por_envase, IF(si.cantidad_por_envase = FLOOR(si.cantidad_por_envase), 0, 2)),
            si.unidad_medida
        ) AS nombre_completo
      FROM stock_items AS si
      JOIN marcas AS m ON si.marca_id = m.id
      JOIN categorias AS c ON m.categoria_id = c.id
      ${whereClause}
      ORDER BY c.nombre, m.nombre, si.variacion, si.cantidad_por_envase -- Ordenar por cantidad
      LIMIT ?
      OFFSET ?;
    `;
    const dataParams = [...queryParams, limit, offset];
    const [items] = await pool.query(dataQuery, dataParams); //

    res.json({
      items: items,
      pagination: { currentPage: page, totalPages, totalItems, limit },
    });
  } catch (error) {
    /* ... (manejo de error sin cambios) ... */
    console.error("Error fetching active stock items:", error);
    res.status(500).json({
      message: "Error del servidor al obtener items de stock activos.",
    });
  }
};

export const getInactiveStockItem = async (req, res) => {
  try {
    // ... (paginación y búsqueda sin cambios) ...
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;
    let whereClause = "WHERE si.is_active = FALSE";
    const queryParams = [];
    if (searchQuery) {
      whereClause +=
        " AND (m.nombre LIKE ? OR c.nombre LIKE ? OR si.variacion LIKE ?)";
      queryParams.push(
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        `%${searchQuery}%`,
      );
    }

    // Consulta de Conteo (sin cambios)
    const countQuery = `...`; // Igual que antes
    const [countRows] = await pool.query(countQuery, queryParams); //
    const totalItems = countRows[0].totalItems;
    const totalPages = Math.ceil(totalItems / limit);

    // Consulta de Datos Paginados
    const dataQuery = `
      SELECT
        si.id,
        m.nombre AS nombre_marca,
        si.variacion,
        si.cantidad_por_envase, -- <-- Nueva
        si.unidad_medida,       -- <-- Nueva
        c.nombre AS nombre_categoria,
        -- Construcción dinámica del nombre completo con unidad
        CONCAT(
            m.nombre,
            CASE WHEN si.variacion IS NOT NULL AND si.variacion != '' THEN CONCAT(' ', si.variacion) ELSE '' END,
            ' ',
            FORMAT(si.cantidad_por_envase, IF(si.cantidad_por_envase = FLOOR(si.cantidad_por_envase), 0, 2)),
            si.unidad_medida
        ) AS nombre_completo
      FROM stock_items si
      JOIN marcas m ON si.marca_id = m.id
      JOIN categorias c ON m.categoria_id = c.id
      ${whereClause}
      ORDER BY m.nombre, si.variacion, si.cantidad_por_envase
      LIMIT ?
      OFFSET ?;
    `;
    const dataParams = [...queryParams, limit, offset];
    const [items] = await pool.query(dataQuery, dataParams); //

    res.json({
      items: items,
      pagination: { currentPage: page, totalPages, totalItems, limit },
    });
  } catch (error) {
    /* ... (manejo de error sin cambios) ... */
    console.error("Error fetching inactive stock items:", error);
    res.status(500).json({
      message: "Error del servidor al obtener items inactivos.",
      error: error.message,
    });
  }
};

export const updateStockItem = async (req, res) => {
  const { id } = req.params;
  const {
    marca_id,
    variacion,
    cantidad_por_envase,
    unidad_medida,
    alerta_stock_bajo,
  } = req.body; // <-- Nuevos campos

  // Validación
  if (
    !marca_id ||
    !cantidad_por_envase ||
    !unidad_medida ||
    !alerta_stock_bajo ||
    !["ml", "g"].includes(unidad_medida)
  ) {
    return res.status(400).json({
      message:
        "Faltan datos obligatorios o la unidad de medida es inválida ('ml' o 'g').",
    });
  }

  try {
    await pool.query(
      //
      // Query actualizada
      "UPDATE stock_items SET marca_id = ?, variacion = ?, cantidad_por_envase = ?, unidad_medida = ?, alerta_stock_bajo = ? WHERE id = ?",
      [
        marca_id,
        variacion || null,
        cantidad_por_envase,
        unidad_medida,
        alerta_stock_bajo,
        id,
      ],
    );
    res.status(200).json({ message: "Item de stock actualizado con éxito." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "Ya existe otro item con esa marca, variación, cantidad y unidad.",
      });
    }
    console.error("Error updating stock item:", error);
    res.status(500).json({
      message: "Error al actualizar el item de stock.",
      error: error.message,
    });
  }
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
  // Ahora esperamos recipe_variant en las reglas, y glassware_id en el producto
  const { nombre_producto_fudo, reglas, glassware_id } = req.body;
  if (
    !nombre_producto_fudo ||
    !reglas ||
    !Array.isArray(reglas) // Permitimos crear producto sin reglas inicialmente
    // || reglas.length === 0 // Quitamos esta validación por ahora
  ) {
    return res.status(400).json({
      message: "El nombre del producto es obligatorio.",
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [productResult] = await connection.query(
      "INSERT INTO productos (nombre_producto_fudo, glassware_id) VALUES (?, ?)",
      [nombre_producto_fudo, glassware_id || null],
    );
    const newProductId = productResult.insertId;

    // Insertar las reglas (si existen)
    if (reglas.length > 0) {
      for (const regla of reglas) {
        const {
          ingredient_type,
          item_id,
          prebatch_id,
          consumo_ml,
          prioridad_item,
          recipe_variant, // <-- Nuevo campo esperado
        } = regla;

        // Validaciones (incluyendo recipe_variant)
        if (
          !ingredient_type ||
          !consumo_ml ||
          !prioridad_item ||
          !recipe_variant ||
          (ingredient_type !== "ITEM" && ingredient_type !== "PREBATCH")
        ) {
          throw new Error(
            "Una regla de la receta está incompleta o tiene tipo/variante inválido.",
          );
        }
        if (ingredient_type === "ITEM" && !item_id) {
          throw new Error("Una regla de tipo 'ITEM' requiere un item_id.");
        }
        if (ingredient_type === "PREBATCH" && !prebatch_id) {
          throw new Error(
            "Una regla de tipo 'PREBATCH' requiere un prebatch_id.",
          );
        }
        if (isNaN(parseInt(recipe_variant)) || parseInt(recipe_variant) <= 0) {
          throw new Error(
            "La Prioridad de Variante debe ser un número positivo.",
          );
        }

        // Sentencia INSERT actualizada con recipe_variant
        await connection.query(
          `INSERT INTO recipes (
               producto_id,
               recipe_variant, -- <-- Nueva columna
               ingredient_type,
               item_id,
               prebatch_id,
               consumo_ml,
               prioridad_item
             ) VALUES (?, ?, ?, ?, ?, ?, ?)`, // <-- 7 placeholders
          [
            newProductId,
            parseInt(recipe_variant), // <-- Guardar variante
            ingredient_type,
            ingredient_type === "ITEM" ? item_id : null,
            ingredient_type === "PREBATCH" ? prebatch_id : null,
            consumo_ml,
            prioridad_item,
          ],
        );
      }
    } // Fin if (reglas.length > 0)

    await connection.commit();
    res.status(201).json({ message: "Producto y receta creados con éxito." });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating recipe:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: `El producto "${nombre_producto_fudo}" ya existe.` });
    }
    if (
      error.message.startsWith("Una regla") ||
      error.message.includes("Prioridad de Variante")
    ) {
      return res.status(400).json({ message: error.message });
    }
    res
      .status(500)
      .json({ message: "Error al guardar la receta.", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const getRecipeById = async (req, res) => {
  const { id } = req.params;
  try {
    const [productRows] = await pool.query(
      `SELECT p.*, g.name as glassware_name 
       FROM productos p 
       LEFT JOIN glassware g ON p.glassware_id = g.id 
       WHERE p.id = ?`,
      [id],
    );
    if (productRows.length === 0)
      return res.status(404).json({ message: "Producto no encontrado." });

    // Consulta modificada para incluir recipe_variant y ordenar por ella
    const [recipeRows] = await pool.query(
      `SELECT
        r.*, -- Selecciona todas las columnas de recetas (incluyendo recipe_variant)
        CASE
          WHEN r.ingredient_type = 'ITEM' THEN (
            SELECT CONCAT(m.nombre, CASE WHEN si.variacion IS NOT NULL AND si.variacion != '' THEN CONCAT(' ', si.variacion) ELSE '' END, ' ', FORMAT(si.cantidad_por_envase, IF(si.cantidad_por_envase = FLOOR(si.cantidad_por_envase), 0, 2)), si.unidad_medida)
            FROM stock_items si JOIN marcas m ON si.marca_id = m.id WHERE si.id = r.item_id
          ) ELSE NULL
        END AS item_nombre_completo,
        CASE
          WHEN r.ingredient_type = 'PREBATCH' THEN (SELECT pb.nombre_prebatch FROM prebatches pb WHERE pb.id = r.prebatch_id)
          ELSE NULL
        END AS prebatch_nombre
      FROM recipes r
      WHERE r.producto_id = ?
      ORDER BY r.recipe_variant ASC, r.id ASC`, // <-- Ordenar por variante
      [id],
    );

    const formattedReglas = recipeRows.map((regla) => ({
      ...regla,
      display_name:
        regla.ingredient_type === "ITEM"
          ? regla.item_nombre_completo
          : regla.prebatch_nombre,
    }));

    res.json({ product: productRows[0], reglas: formattedReglas });
  } catch (error) {
    console.error("Error fetching recipe by id:", error);
    res.status(500).json({ message: "Error al obtener la receta." });
  }
};

export const updateRecipe = async (req, res) => {
  const { id } = req.params;
  const { nombre_producto_fudo, reglas, glassware_id } = req.body;

  if (!nombre_producto_fudo || !Array.isArray(reglas)) {
    // Validar que reglas sea array
    return res.status(400).json({
      message: "El nombre del producto y un array de reglas son obligatorios.",
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      "UPDATE productos SET nombre_producto_fudo = ?, glassware_id = ? WHERE id = ?",
      [nombre_producto_fudo, glassware_id || null, id],
    );
    await connection.query("DELETE FROM recipes WHERE producto_id = ?", [id]);

    // Insertar nuevas reglas (si existen)
    if (reglas.length > 0) {
      for (const regla of reglas) {
        const {
          ingredient_type,
          item_id,
          prebatch_id,
          consumo_ml,
          prioridad_item,
          recipe_variant, // <-- Incluir variante
        } = regla;

        // Validaciones (incluyendo recipe_variant)
        if (
          !ingredient_type ||
          !consumo_ml ||
          !prioridad_item ||
          !recipe_variant ||
          (ingredient_type !== "ITEM" && ingredient_type !== "PREBATCH")
        ) {
          throw new Error(
            "Una regla de la receta está incompleta o tiene tipo/variante inválido.",
          );
        }
        if (ingredient_type === "ITEM" && !item_id) {
          throw new Error("Una regla 'ITEM' requiere item_id.");
        }
        if (ingredient_type === "PREBATCH" && !prebatch_id) {
          throw new Error("Una regla 'PREBATCH' requiere prebatch_id.");
        }
        if (isNaN(parseInt(recipe_variant)) || parseInt(recipe_variant) <= 0) {
          throw new Error(
            "La Prioridad de Variante debe ser un número positivo.",
          );
        }

        // Sentencia INSERT actualizada con recipe_variant
        await connection.query(
          `INSERT INTO recipes (
               producto_id, recipe_variant, ingredient_type, item_id, prebatch_id, consumo_ml, prioridad_item
             ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id, // Usar ID existente
            parseInt(recipe_variant), // <-- Guardar variante
            ingredient_type,
            ingredient_type === "ITEM" ? item_id : null,
            ingredient_type === "PREBATCH" ? prebatch_id : null,
            consumo_ml,
            prioridad_item,
          ],
        );
      }
    } // Fin if (reglas.length > 0)

    await connection.commit();
    res.status(200).json({ message: "Receta actualizada con éxito." });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating recipe:", error);
    if (
      error.message.startsWith("Una regla") ||
      error.message.includes("Prioridad de Variante")
    ) {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: `Ya existe otro producto con el nombre "${nombre_producto_fudo}".`,
      });
    }
    res.status(500).json({
      message: "Error al actualizar la receta.",
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
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

// --- GESTIÓN DE USUARIOS ---

export const createUser = async (req, res) => {
  // Ahora espera role_id
  const {
    username,
    password,
    role_id,
    display_name,
    full_name,
    email_contact,
    phone,
  } = req.body;

  if (!username || !password || !role_id) {
    return res
      .status(400)
      .json({ message: "Usuario, contraseña y rol son obligatorios." });
  }

  let connection;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Insertar en 'users' (con role_id y is_active = TRUE)
    const [userResult] = await connection.query(
      "INSERT INTO users (username, password, role_id, display_name, is_active) VALUES (?, ?, ?, ?, TRUE)",
      [username, hashedPassword, role_id, display_name || null],
    );
    const newUserId = userResult.insertId;

    // 2. Insertar en 'employee_details'
    await connection.query(
      "INSERT INTO employee_details (user_id, full_name, email_contact, phone) VALUES (?, ?, ?, ?)",
      [newUserId, full_name || null, email_contact || null, phone || null],
    );

    await connection.commit();
    res
      .status(201)
      .json({ message: "Usuario creado con éxito.", userId: newUserId });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "El nombre de usuario ya existe." });
    }
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error al registrar el usuario." });
  } finally {
    if (connection) connection.release();
  }
};

export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereClause = "WHERE u.is_active = TRUE";
    const queryParams = [];

    if (searchQuery) {
      whereClause +=
        " AND (u.username LIKE ? OR u.display_name LIKE ? OR d.full_name LIKE ? OR r.name LIKE ?)";
      queryParams.push(
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        `%${searchQuery}%`,
      );
    }

    const countQuery = `
      SELECT COUNT(u.id) AS totalUsers 
      FROM users u 
      LEFT JOIN employee_details d ON u.id = d.user_id 
      LEFT JOIN roles r ON u.role_id = r.id
      ${whereClause}`;
    const [countRows] = await pool.query(countQuery, queryParams);
    const totalUsers = countRows[0].totalUsers;
    const totalPages = Math.ceil(totalUsers / limit);

    const dataQuery = `
      SELECT u.id, u.username, u.display_name, d.full_name, r.name as role_name
      FROM users u
      LEFT JOIN employee_details d ON u.id = d.user_id
      LEFT JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.username ASC
      LIMIT ? OFFSET ?
    `;
    const [users] = await pool.query(dataQuery, [
      ...queryParams,
      limit,
      offset,
    ]);

    res.json({
      users,
      pagination: { currentPage: page, totalPages, totalUsers, limit },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error del servidor al obtener usuarios." });
  }
};

// GET /admin/users/inactive (Paginado, Inactivos)
export const getInactiveUsers = async (req, res) => {
  // ... (Lógica idéntica a getUsers, pero con 'WHERE u.is_active = FALSE')
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;
    let whereClause = "WHERE u.is_active = FALSE";
    const queryParams = [];
    if (searchQuery) {
      whereClause +=
        " AND (u.username LIKE ? OR u.display_name LIKE ? OR d.full_name LIKE ?)";
      queryParams.push(
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        `%${searchQuery}%`,
      );
    }
    const countQuery = `SELECT COUNT(u.id) AS totalUsers FROM users u LEFT JOIN employee_details d ON u.id = d.user_id ${whereClause}`;
    const [countRows] = await pool.query(countQuery, queryParams);
    const totalUsers = countRows[0].totalUsers;
    const totalPages = Math.ceil(totalUsers / limit);
    const dataQuery = `
      SELECT u.id, u.username, u.display_name, d.full_name, r.name as role_name
      FROM users u
      LEFT JOIN employee_details d ON u.id = d.user_id
      LEFT JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.username ASC
      LIMIT ? OFFSET ?
    `;
    const [users] = await pool.query(dataQuery, [
      ...queryParams,
      limit,
      offset,
    ]);
    res.json({
      users,
      pagination: { currentPage: page, totalPages, totalUsers, limit },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error del servidor al obtener usuarios inactivos." });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.role_id, u.display_name,
              d.full_name, d.email_contact, d.phone
       FROM users u
       LEFT JOIN employee_details d ON u.id = d.user_id
       WHERE u.id = ?`,
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error del servidor." });
  }
};

// PUT /admin/users/:id (Admin edita a otro usuario)
export const updateUser = async (req, res) => {
  const { id } = req.params;
  // Admin SÍ PUEDE cambiar el rol y los datos personales
  // El 'username' no se puede cambiar
  const { role_id, display_name, full_name, email_contact, phone } = req.body;

  if (!role_id) {
    return res.status(400).json({ message: "El rol es obligatorio." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Construir query dinámica para 'users'
    let userQuery = "UPDATE users SET role_id = ?, display_name = ?";
    const userParams = [role_id, display_name || null];

    // Si viene password, lo hasheamos y agregamos a la query
    if (req.body.password && req.body.password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      userQuery += ", password = ?";
      userParams.push(hashedPassword);
    }

    userQuery += " WHERE id = ?";
    userParams.push(id);

    await connection.query(userQuery, userParams);

    // 2. Actualizar (o Insertar) 'employee_details'
    await connection.query(
      `INSERT INTO employee_details (user_id, full_name, email_contact, phone)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         email_contact = VALUES(email_contact),
         phone = VALUES(phone)`,
      [id, full_name || null, email_contact || null, phone || null],
    );

    await connection.commit();
    res.json({ message: "Usuario actualizado con éxito." });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error al actualizar el usuario." });
  } finally {
    if (connection) connection.release();
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE users SET is_active = FALSE WHERE id = ?", [id]);
    res.status(200).json({ message: "Usuario desactivado con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al desactivar el usuario." });
  }
};

// PUT /admin/users/:id/restore (Soft Delete Restore)
export const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE users SET is_active = TRUE WHERE id = ?", [id]);
    res.status(200).json({ message: "Usuario restaurado con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al restaurar el usuario." });
  }
};

export const seedPermissions = async (req, res) => {
  // Basado en tu matriz de permisos
  const permissions = [
    { name: "Ver Dashboard y Stock", key: "dashboard:view" },
    { name: "Ver Historial de Movimientos", key: "history:view" },
    { name: "Registrar Compras", key: "purchases:create" },
    { name: "Cargar Ventas", key: "sales:upload" },
    { name: "Registrar Producción", key: "production:create" },
    { name: "Ajustar Stock", key: "stock:adjust" },
    { name: "Gestionar Catálogo (Items, Recetas)", key: "catalog:manage" },
    { name: "Gestionar Equipo (Usuarios)", key: "users:manage" },
    { name: "Gestionar Roles y Permisos", key: "roles:manage" },
    { name: "Ver Reservas/Eventos", key: "reservations:view" },
    { name: "Gestionar Reservas/Eventos", key: "reservations:manage" },
    { name: "Ver Cronograma", key: "schedules:view" },
    { name: "Gestionar Cronograma", key: "schedules:manage" },
  ];

  try {
    const query =
      "INSERT INTO permissions (name, permission_key) VALUES ? ON DUPLICATE KEY UPDATE name=VALUES(name)";
    const values = permissions.map((p) => [p.name, p.key]);

    await pool.query(query, [values]);
    res
      .status(201)
      .json({ message: "Permisos creados/actualizados con éxito." });
  } catch (error) {
    console.error("Error seeding permissions:", error);
    res
      .status(500)
      .json({ message: "Error al sembrar permisos.", error: error.message });
  }
};

export const getPermissions = async (req, res) => {
  try {
    const [permissions] = await pool.query(
      "SELECT * FROM permissions ORDER BY name ASC",
    );
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener permisos." });
  }
};

export const getRoles = async (req, res) => {
  try {
    const [roles] = await pool.query("SELECT * FROM roles ORDER BY name ASC");
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener roles." });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const [roles] = await pool.query("SELECT * FROM roles WHERE id = ?", [id]);
    if (roles.length === 0) {
      return res.status(404).json({ message: "Rol no encontrado." });
    }

    const [permissions] = await pool.query(
      "SELECT permission_id FROM role_permissions WHERE role_id = ?",
      [id],
    );
    const permissionIds = permissions.map((p) => p.permission_id);

    res.json({ role: roles[0], permissionIds });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el rol." });
  }
};

export const createRole = async (req, res) => {
  const { name, description, permissionIds } = req.body;
  if (!name || !Array.isArray(permissionIds)) {
    return res
      .status(400)
      .json({ message: "Nombre y lista de permisos son requeridos." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [roleResult] = await connection.query(
      "INSERT INTO roles (name, description) VALUES (?, ?)",
      [name, description],
    );
    const newRoleId = roleResult.insertId;

    if (permissionIds.length > 0) {
      const rolePermsData = permissionIds.map((permId) => [newRoleId, permId]);
      await connection.query(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES ?",
        [rolePermsData],
      );
    }

    await connection.commit();
    res
      .status(201)
      .json({ message: "Rol creado con éxito.", roleId: newRoleId });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ message: "Error al crear el rol." });
  } finally {
    if (connection) connection.release();
  }
};

// PUT /admin/roles/:id
export const updateRole = async (req, res) => {
  const { id } = req.params;
  const { name, description, permissionIds } = req.body;
  if (!name || !Array.isArray(permissionIds)) {
    return res
      .status(400)
      .json({ message: "Nombre y lista de permisos son requeridos." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Actualizar datos del rol
    await connection.query(
      "UPDATE roles SET name = ?, description = ? WHERE id = ?",
      [name, description, id],
    );

    // 2. Borrar permisos antiguos
    await connection.query("DELETE FROM role_permissions WHERE role_id = ?", [
      id,
    ]);

    // 3. Insertar permisos nuevos (si los hay)
    if (permissionIds.length > 0) {
      const rolePermsData = permissionIds.map((permId) => [id, permId]);
      await connection.query(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES ?",
        [rolePermsData],
      );
    }

    await connection.commit();
    res.status(200).json({ message: "Rol actualizado con éxito." });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ message: "Error al actualizar el rol." });
  } finally {
    if (connection) connection.release();
  }
};

// DELETE /admin/roles/:id
export const deleteRole = async (req, res) => {
  // Nota: Al borrar un rol, la BD (ON DELETE SET NULL)
  // pondrá 'role_id = NULL' a los usuarios que lo tenían.
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM roles WHERE id = ?", [id]);
    res.status(200).json({ message: "Rol eliminado con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el rol." });
  }
};
