// Importamos el pool de la base de datos que crearemos en /config/db.js
import pool from "../config/db.js";
import { buildNombreCompleto } from "../utils/helpers.js";

// Controlador para GET /api/stock
export const getStock = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15; // 15 items por página
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereClause = "WHERE si.is_active = TRUE";
    const queryParams = [];

    if (searchQuery) {
      // Buscamos en nombre de marca y nombre de categoría
      whereClause +=
        " AND (m.nombre LIKE ? OR c.nombre LIKE ? OR si.variacion LIKE ?)";
      queryParams.push(
        `%${searchQuery}%`,
        `%${searchQuery}%`,
        `%${searchQuery}%`,
      );
    }

    // 1. Consulta para el CONTEO TOTAL de items
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

    // 2. Consulta para obtener los ITEMS PAGINADOS
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
      ORDER BY c.nombre, m.nombre, si.variacion, si.cantidad_por_envase
      LIMIT ?
      OFFSET ?;
    `;
    const dataParams = [...queryParams, limit, offset];
    const [items] = await pool.query(dataQuery, dataParams);

    // 3. Devolver la respuesta estructurada
    res.json({
      items: items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    });
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
        si.unidad_medida,
        SUM(si.stock_unidades * si.cantidad_por_envase) / 1000 AS total_calculado -- Dividido por 1000 para L o Kg
      FROM stock_items AS si
      JOIN marcas AS m ON si.marca_id = m.id
      WHERE si.is_active = TRUE AND si.stock_unidades > 0 -- Solo activos y con stock
      GROUP BY m.nombre, si.unidad_medida -- Agrupar también por unidad
      ORDER BY si.unidad_medida, m.nombre;
    `;
    const [rows] = await pool.query(query); //

    // Separar en líquidos y sólidos
    const liquids = rows
      .filter((r) => r.unidad_medida === "ml")
      .map((r) => ({
        display_nombre: r.display_nombre,
        total_litros: r.total_calculado,
      }));
    const solids = rows
      .filter((r) => r.unidad_medida === "g")
      .map((r) => ({
        display_nombre: r.display_nombre,
        total_kilogramos: r.total_calculado,
      }));

    res.json({ liquids, solids }); // Devolver objeto con ambas listas
  } catch (error) {
    console.error("Error al calcular los totales de stock:", error);
    res.status(500).json({
      message: "Error al calcular los totales.",
      error: error.message,
    });
  }
};

export const searchStockItems = async (req, res) => {
  try {
    // ... (query, limit, if !query sin cambios) ...
    const query = req.query.query || "";
    const limit = parseInt(req.query.limit) || 10;
    if (!query) return res.json([]);

    const searchQuery = `
     SELECT
        si.id,
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
      WHERE si.is_active = TRUE
        AND (
          m.nombre LIKE ?
          OR si.variacion LIKE ?
          OR si.cantidad_por_envase LIKE ? -- Buscar por cantidad también
          OR CONCAT( /* ... misma construcción que arriba ... */
               m.nombre,
               CASE WHEN si.variacion IS NOT NULL AND si.variacion != '' THEN CONCAT(' ', si.variacion) ELSE '' END,
               ' ',
               FORMAT(si.cantidad_por_envase, IF(si.cantidad_por_envase = FLOOR(si.cantidad_por_envase), 0, 2)),
               si.unidad_medida
             ) LIKE ?
        )
      ORDER BY nombre_completo ASC
      LIMIT ?;
    `;

    // Añadir búsqueda por cantidad
    const searchParams = [
      `%${query}%`,
      `%${query}%`,
      `%${query}%`,
      `%${query}%`,
      limit,
    ];
    const [rows] = await pool.query(searchQuery, searchParams); //

    res.json(rows);
  } catch (error) {
    /* ... (manejo de error sin cambios) ... */
    console.error("Error searching stock items:", error);
    res.status(500).json({ message: "Error al buscar items de stock." });
  }
};

// Controlador para POST /api/stock/compras
export const registerPurchase = async (req, res) => {
  const { descripcion, itemsComprados } = req.body;

  if (
    !itemsComprados ||
    !Array.isArray(itemsComprados) ||
    itemsComprados.length === 0
  ) {
    return res
      .status(400)
      .json({ message: "Datos de la compra inválidos o vacíos." });
  }

  // 2. NUEVO: Validamos la descripción
  if (!descripcion) {
    return res
      .status(400)
      .json({ message: "Se requiere un detalle para la compra." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 3. MODIFICADO: Usamos la descripción del payload
    const descripcionEvento = descripcion;
    const [eventoResult] = await connection.query(
      "INSERT INTO eventos_stock (tipo_evento, descripcion) VALUES ('COMPRA', ?)",
      [descripcionEvento],
    );
    const eventoId = eventoResult.insertId;

    for (const item of itemsComprados) {
      const [stockActualRows] = await connection.query(
        "SELECT stock_unidades FROM stock_items WHERE id = ?",
        [item.itemId],
      );
      if (stockActualRows.length === 0) {
        throw new Error(`El item con ID ${item.itemId} no fue encontrado.`);
      }
      const stockAnterior = stockActualRows[0].stock_unidades;
      const stockNuevo = stockAnterior + item.cantidad;

      await connection.query(
        "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
        [stockNuevo, item.itemId],
      );

      // 4. MODIFICADO: Usamos la descripción general para el movimiento individual
      await connection.query(
        `INSERT INTO stock_movements 
         (item_id, tipo_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo, descripcion, evento_id) 
         VALUES (?, 'COMPRA', ?, ?, ?, ?, ?)`,
        [
          item.itemId,
          item.cantidad,
          stockAnterior,
          stockNuevo,
          descripcionEvento, // <-- Usamos la descripción general
          eventoId,
        ],
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
      [itemId],
    );
    if (stockActualRows.length === 0) {
      throw new Error(`El item con ID ${itemId} no fue encontrado.`);
    }
    const stockAnterior = stockActualRows[0].stock_unidades;

    const cantidadMovida = conteoReal - stockAnterior;

    // NUEVO: 1. Creamos el evento de AJUSTE
    const descEvento = descripcion || "Ajuste por conteo físico";
    const [eventoResult] = await connection.query(
      "INSERT INTO eventos_stock (tipo_evento, descripcion) VALUES ('AJUSTE', ?)",
      [descEvento],
    );
    const eventoId = eventoResult.insertId;

    if (cantidadMovida !== 0) {
      await connection.query(
        "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
        [conteoReal, itemId],
      );

      // MODIFICADO: 2. Añadimos el evento_id
      await connection.query(
        `INSERT INTO stock_movements 
             (item_id, tipo_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo, descripcion, evento_id) 
             VALUES (?, 'AJUSTE', ?, ?, ?, ?, ?)`, // <-- 7 signos
        [
          itemId,
          cantidadMovida,
          stockAnterior,
          conteoReal,
          descEvento, // Usamos la misma descripción para el movimiento
          eventoId, // <-- El nuevo ID del evento
        ],
      );
    }

    await connection.commit();
    res.status(200).json({
      message: `Ajuste registrado. Se movieron ${cantidadMovida.toFixed(
        2,
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
  const { descripcion, ajustes } = req.body;

  if (!ajustes || !Array.isArray(ajustes) || ajustes.length === 0) {
    return res
      .status(400)
      .json({ message: "No se proporcionaron datos para el ajuste." });
  }

  // 2. NUEVO: Validamos la descripción
  if (!descripcion) {
    return res
      .status(400)
      .json({ message: "Se requiere un motivo o descripción." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 3. MODIFICADO: Usamos la descripción del payload
    const descEvento = descripcion; // Ya viene validada desde el frontend
    const [eventoResult] = await connection.query(
      "INSERT INTO eventos_stock (tipo_evento, descripcion) VALUES ('AJUSTE', ?)",
      [descEvento],
    );
    const eventoId = eventoResult.insertId;

    for (const ajuste of ajustes) {
      const { itemId, conteoReal } = ajuste;

      const [stockActualRows] = await connection.query(
        "SELECT stock_unidades FROM stock_items WHERE id = ? FOR UPDATE",
        [itemId],
      );

      if (stockActualRows.length === 0) {
        throw new Error(`Item con ID ${itemId} no encontrado.`);
      }

      const stockAnterior = stockActualRows[0].stock_unidades;
      const cantidadMovida = conteoReal - stockAnterior;

      if (cantidadMovida !== 0) {
        await connection.query(
          "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
          [conteoReal, itemId],
        );

        // 4. MODIFICADO: Usamos la descripción general del evento para todos los movimientos
        await connection.query(
          `INSERT INTO stock_movements 
           (item_id, tipo_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo, descripcion, evento_id) 
           VALUES (?, 'AJUSTE', ?, ?, ?, ?, ?)`,
          [
            itemId,
            cantidadMovida,
            stockAnterior,
            conteoReal,
            descEvento, // <-- Usamos la descripción general
            eventoId,
          ],
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;

    // 1. MODIFICACIÓN: WhereClause ahora solo filtra por descripción si hay búsqueda
    let whereClause = ""; // Inicia vacío
    const queryParams = [];

    if (searchQuery) {
      whereClause = "WHERE e.descripcion LIKE ?"; // Añadir WHERE solo si hay búsqueda
      queryParams.push(`%${searchQuery}%`);
    }

    // 2. MODIFICACIÓN: Consulta de Conteo - Simplificada
    //    Ahora cuenta directamente de eventos_stock aplicando solo el filtro de búsqueda.
    const countQuery = `
      SELECT COUNT(e.id) AS totalEventos
      FROM eventos_stock AS e
      ${whereClause};
    `;

    // Pasamos solo los parámetros de búsqueda si existen
    const [countRows] = await pool.query(countQuery, queryParams);
    const totalEventos = countRows[0].totalEventos;
    const totalPages = Math.ceil(totalEventos / limit);

    // 3. MODIFICACIÓN: Consulta de Datos - Eliminado `sm.id IS NOT NULL`
    //    Mantenemos el LEFT JOIN para contar items_afectados correctamente.
    const dataQuery = `
      SELECT
        e.id AS evento_id,
        e.tipo_evento,
        e.descripcion AS evento_descripcion,
        e.fecha_evento,
        COUNT(sm.id) AS items_afectados -- Contar movimientos asociados (será 0 si no hay)
      FROM eventos_stock AS e
      LEFT JOIN stock_movements AS sm ON e.id = sm.evento_id
      ${whereClause} -- Aplicar filtro de búsqueda si existe
      GROUP BY e.id, e.tipo_evento, e.descripcion, e.fecha_evento -- Agrupar por todos los campos de evento
      ORDER BY e.fecha_evento DESC
      LIMIT ?
      OFFSET ?;
    `;

    // Añadir parámetros de paginación
    const dataParams = [...queryParams, limit, offset];
    const [eventos] = await pool.query(dataQuery, dataParams);

    // 4. Respuesta (sin cambios)
    res.json({
      eventos,
      pagination: {
        currentPage: page,
        totalPages,
        totalEventos, // Usamos el nuevo conteo
        limit,
      },
    });
  } catch (error) {
    console.error("Error al consultar lista de eventos:", error);
    res.status(500).json({
      message: "Error al consultar lista de eventos.",
      error: error.message,
    });
  }
};

export const getMovementEventById = async (req, res) => {
  const { id } = req.params;
  const PREBATCH_ENVASE_SIZE = 5000.0; // <-- Definimos tu estándar de 5L aquí

  try {
    const query = `
      SELECT
        e.id AS evento_id,
        e.tipo_evento,
        e.descripcion AS evento_descripcion,
        e.fecha_evento,
        
        IF(COUNT(sm.id) = 0, 
          JSON_ARRAY(), 
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', sm.id,
              
              'nombre_item', IF(
                  sm.prebatch_id_afectado IS NOT NULL, 
                  (SELECT CONCAT(pb.nombre_prebatch, ' (Lote ID: ', pb.id, ')') FROM prebatches pb WHERE pb.id = sm.prebatch_id_afectado), 
                  CONCAT(
                      m.nombre,
                      CASE WHEN si.variacion IS NOT NULL AND si.variacion != '' THEN CONCAT(' ', si.variacion) ELSE '' END,
                      ' ',
                      FORMAT(si.cantidad_por_envase, IF(si.cantidad_por_envase = FLOOR(si.cantidad_por_envase), 0, 2)),
                      si.unidad_medida
                  )
              ),
              
              'tipo_ingrediente', IF(sm.prebatch_id_afectado IS NOT NULL, 'PREBATCH', 'ITEM'),

              -- --- INICIO DE LA MODIFICACIÓN ---
              -- Valores en "Unidades" (Calculados para items Y prebatches)
              'cantidad_movida_unid', IF(
                  sm.prebatch_id_afectado IS NOT NULL, 
                  sm.cantidad_unidades_movidas / ${PREBATCH_ENVASE_SIZE}, -- <-- ¡CALCULADO!
                  sm.cantidad_unidades_movidas 
              ),
              'stock_anterior_unid', IF(
                  sm.prebatch_id_afectado IS NOT NULL, 
                  sm.stock_anterior / ${PREBATCH_ENVASE_SIZE}, -- <-- ¡CALCULADO!
                  sm.stock_anterior
              ),
              'stock_nuevo_unid', IF(
                  sm.prebatch_id_afectado IS NOT NULL, 
                  sm.stock_nuevo / ${PREBATCH_ENVASE_SIZE}, -- <-- ¡CALCULADO!
                  sm.stock_nuevo
              ),

              -- Valores en "ml" (Calculados para items, directos para prebatches)
              'cantidad_movida_ml', IF(
                  sm.prebatch_id_afectado IS NOT NULL, 
                  sm.cantidad_unidades_movidas, 
                  sm.cantidad_unidades_movidas * si.cantidad_por_envase 
              ),
              'stock_anterior_ml', IF(
                  sm.prebatch_id_afectado IS NOT NULL, 
                  sm.stock_anterior, 
                  sm.stock_anterior * si.cantidad_por_envase 
              ),
              'stock_nuevo_ml', IF(
                  sm.prebatch_id_afectado IS NOT NULL, 
                  sm.stock_nuevo, 
                  sm.stock_nuevo * si.cantidad_por_envase 
              ),
              -- --- FIN DE LA MODIFICACIÓN ---
              
              'descripcion_movimiento', ''
            )
          )
        ) AS movimientos
      FROM eventos_stock AS e
      
      LEFT JOIN stock_movements AS sm ON e.id = sm.evento_id
      LEFT JOIN stock_items AS si ON sm.item_id = si.id
      LEFT JOIN marcas AS m ON si.marca_id = m.id
      
      WHERE e.id = ? 
      
      GROUP BY e.id, e.tipo_evento, e.descripcion, e.fecha_evento;
    `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Evento no encontrado." });
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    console.error("Error al consultar detalle del evento:", error);
    res.status(500).json({
      message: "Error al consultar detalle del evento.",
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
    // Asumimos que el hielo se guarda en 'g'
    const query = `
      SELECT
        m.nombre AS nombre_marca,
        si.variacion,
        SUM(si.stock_unidades) AS total_unidades -- <-- CAMBIO AQUÍ
      FROM stock_items si
      JOIN marcas m ON si.marca_id = m.id
      JOIN categorias c ON m.categoria_id = c.id
      WHERE UPPER(c.nombre) = 'HIELO' AND si.is_active = TRUE
      GROUP BY m.nombre, si.variacion
      ORDER BY m.nombre, si.variacion;
    `;
    const [rows] = await pool.query(query);

    // Mapeo modificado para enviar 'total_unidades'
    const reportData = rows.map((item) => ({
      nombre_completo_hielo: `${item.nombre_marca}${
        item.variacion ? " " + item.variacion : ""
      }`,
      total_unidades: item.total_unidades, // <-- CAMBIO AQUÍ
    }));
    res.json(reportData);
  } catch (error) {
    /* ... (manejo de error) ... */
    console.error("Error al generar el Informe Hielístico:", error);
    res.status(500).json({
      message: "Error al generar el Informe Hielístico.",
      error: error.message,
    });
  }
};

export const getStockAlerts = async (req, res) => {
  try {
    const buildAlertQuery = (condition) => `
      SELECT
        si.id,
        m.nombre as nombre_marca,
        si.variacion,
        si.cantidad_por_envase, -- <-- Nueva
        si.unidad_medida,       -- <-- Nueva
        si.stock_unidades,
        si.alerta_stock_bajo,
        -- Construcción dinámica del nombre completo con unidad
        CONCAT(
            m.nombre,
            CASE WHEN si.variacion IS NOT NULL AND si.variacion != '' THEN CONCAT(' ', si.variacion) ELSE '' END,
            ' ',
            FORMAT(si.cantidad_por_envase, IF(si.cantidad_por_envase = FLOOR(si.cantidad_por_envase), 0, 2)),
            si.unidad_medida
        ) AS nombre_item
      FROM stock_items si
      JOIN marcas m ON si.marca_id = m.id
      WHERE si.is_active = TRUE AND ${condition};
    `;

    const lowStockQuery = buildAlertQuery(
      "si.stock_unidades > 0 AND si.stock_unidades <= si.alerta_stock_bajo",
    );
    const [lowStockItems] = await pool.query(lowStockQuery); //

    const outOfStockQuery = buildAlertQuery("si.stock_unidades <= 0");
    const [outOfStockItems] = await pool.query(outOfStockQuery); //

    res.json({
      lowStock: lowStockItems,
      outOfStock: outOfStockItems,
    });
  } catch (error) {
    /* ... (manejo de error) ... */
    console.error("Error al obtener alertas de stock:", error);
    res.status(500).json({
      message: "Error al obtener alertas de stock.",
      error: error.message,
    });
  }
};

export const registerProduction = async (req, res) => {
  // 👇 CORRECCIÓN: Añadir categoryId a la desestructuración 👇
  const {
    prebatchName,
    productionDate,
    quantityProducedMl,
    description,
    ingredients,
    expiryDate,
    categoryId,
  } = req.body;

  // 1. Validaciones (Robustecidas un poco)
  if (!prebatchName || !productionDate || !quantityProducedMl || !description) {
    console.error(
      "Error Validación registerProduction: Faltan datos básicos",
      req.body,
    );
    return res.status(400).json({
      message:
        "Faltan datos obligatorios (Nombre, Fecha Prod., Cantidad Prod., Descripción).",
    });
  }
  if (
    isNaN(parseFloat(quantityProducedMl)) ||
    parseFloat(quantityProducedMl) <= 0
  ) {
    console.error(
      "Error Validación registerProduction: Cantidad inválida",
      req.body.quantityProducedMl,
    );
    return res
      .status(400)
      .json({ message: "La cantidad producida debe ser un número positivo." });
  }
  if (ingredients && !Array.isArray(ingredients)) {
    console.error(
      "Error Validación registerProduction: Formato ingredientes inválido",
      req.body.ingredients,
    );
    return res.status(400).json({
      message:
        "El formato de los ingredientes es inválido (debe ser un array).",
    });
  }
  // Validar formato fechas si vienen
  if (productionDate && isNaN(Date.parse(productionDate))) {
    return res
      .status(400)
      .json({ message: "Formato de fecha de producción inválido." });
  }
  if (expiryDate && isNaN(Date.parse(expiryDate))) {
    return res
      .status(400)
      .json({ message: "Formato de fecha de vencimiento inválido." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 2. Crear evento de PRODUCCION
    const [eventoResult] = await connection.query(
      "INSERT INTO eventos_stock (tipo_evento, descripcion) VALUES ('PRODUCCION', ?)",
      [description],
    );
    const eventoId = eventoResult.insertId;

    // 3. Procesar ingredientes (si existen)
    if (ingredients && ingredients.length > 0) {
      for (const ingredient of ingredients) {
        const { itemId, quantityConsumedMl } = ingredient;

        // Validar datos del ingrediente
        if (
          !itemId ||
          !quantityConsumedMl ||
          isNaN(parseFloat(quantityConsumedMl)) ||
          parseFloat(quantityConsumedMl) <= 0
        ) {
          throw new Error(
            `Ingrediente inválido encontrado en la lista: ID=${itemId}, Consumo=${quantityConsumedMl}`,
          );
        }
        const consumedMl = parseFloat(quantityConsumedMl);

        // Obtener info y stock actual del item con bloqueo
        const [itemInfoRows] = await connection.query(
          `SELECT si.stock_unidades, si.variacion, si.cantidad_por_envase, si.unidad_medida, m.nombre as nombre_marca
            FROM stock_items si
            JOIN marcas m ON si.marca_id = m.id
            WHERE si.id = ? AND si.is_active = TRUE FOR UPDATE`,
          [itemId],
        );

        if (itemInfoRows.length === 0) {
          // Intentar obtener el nombre aunque no esté activo/no tenga stock para un mejor mensaje
          const [inactiveItem] = await connection.query(
            `SELECT CONCAT(m.nombre, ' ', COALESCE(si.variacion,''), ' ', si.cantidad_por_envase, si.unidad_medida) as nombre
             FROM stock_items si JOIN marcas m ON si.marca_id = m.id WHERE si.id = ?`,
            [itemId],
          );
          const itemName =
            inactiveItem.length > 0
              ? `"${inactiveItem[0].nombre}" (ID: ${itemId})`
              : `ID ${itemId}`;
          throw new Error(
            `Ingrediente ${itemName} no encontrado, no está activo o no tiene stock.`,
          );
        }
        const itemInfo = itemInfoRows[0];
        const stockAnterior = itemInfo.stock_unidades;
        const nombreCompletoItem = buildNombreCompleto(
          itemInfo.nombre_marca,
          itemInfo.variacion,
          itemInfo.cantidad_por_envase,
          itemInfo.unidad_medida,
        );

        // Verificar cantidad_por_envase válida
        if (itemInfo.cantidad_por_envase <= 0) {
          console.error(
            `Cantidad por envase inválida (${itemInfo.cantidad_por_envase}) para item ${nombreCompletoItem} (ID: ${itemId})`,
          );
          continue;
        }

        // Calcular unidades a descontar
        let cantidadConsumidaEnUnidadBase = consumedMl;
        if (itemInfo.unidad_medida === "g") {
          // Asumiendo 1ml = 1g para items sólidos
          cantidadConsumidaEnUnidadBase = consumedMl;
        }
        const aDescontarEnUnidades =
          cantidadConsumidaEnUnidadBase / itemInfo.cantidad_por_envase;

        const stockNuevo = stockAnterior - aDescontarEnUnidades;

        // Verificar stock suficiente
        if (stockNuevo < -0.001) {
          throw new Error(
            `Stock insuficiente para "${nombreCompletoItem}" (ID: ${itemId}). Necesita consumir: ${aDescontarEnUnidades.toFixed(
              3,
            )} unid. (${cantidadConsumidaEnUnidadBase}${
              itemInfo.unidad_medida
            }), Disponible: ${stockAnterior.toFixed(3)} unid.`,
          );
        }
        const stockNuevoRedondeado = parseFloat(stockNuevo.toFixed(5));

        // Actualizar stock_items
        await connection.query(
          "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
          [stockNuevoRedondeado, itemId],
        );

        // Crear descripción para el movimiento
        const descripcionMovimiento = `${description} (Consumo: ${nombreCompletoItem})`;

        // Insertar stock_movements
        await connection.query(
          `INSERT INTO stock_movements (item_id, tipo_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo, descripcion, evento_id) VALUES (?, 'CONSUMO', ?, ?, ?, ?, ?)`,
          [
            itemId,
            -aDescontarEnUnidades,
            stockAnterior,
            stockNuevoRedondeado,
            descripcionMovimiento,
            eventoId,
          ],
        );
      }
    }

    // 4. Crear Prebatch (CORREGIDO - usa categoryId)
    await connection.query(
      `INSERT INTO prebatches (nombre_prebatch, fecha_produccion, fecha_vencimiento, categoria_id, cantidad_inicial_ml, cantidad_actual_ml, identificador_lote, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        prebatchName,
        productionDate,
        expiryDate || null,
        categoryId || null,
        quantityProducedMl,
        quantityProducedMl,
        null,
      ],
    );

    await connection.commit();

    res.status(200).json({
      message:
        "Producción registrada y stock de ingredientes descontado con éxito.",
    });
  } catch (error) {
    console.error("Error en registerProduction:", error);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({
      message:
        error.message ||
        "Error interno del servidor al registrar la producción.",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
