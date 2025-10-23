// Importamos el pool de la base de datos que crearemos en /config/db.js
import pool from "../config/db.js";

// Función auxiliar para construir el nombre completo del item
const buildNombreCompleto = (nombreMarca, variacion, equivalenciaMl) => {
  let parts = [nombreMarca];
  if (variacion && variacion.trim() !== "") {
    parts.push(variacion.trim());
  }
  // Solo añadir equivalencia si es un número válido y mayor a 0, útil si se usa para ingredientes sin ml
  if (typeof equivalenciaMl === "number" && equivalenciaMl > 0) {
    parts.push(`${equivalenciaMl}ml`);
  }
  return parts.join(" ");
};
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
        `%${searchQuery}%`
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
        si.equivalencia_ml,
        si.stock_unidades,
        m.id as marca_id,
        CONCAT(
        m.nombre,
        CASE WHEN si.variacion IS NOT NULL and si.variacion != '' THEN CONCAT(' ', si.variacion) ELSE '' END,
        ' ', 
        si.equivalencia_ml, 'ml'
        ) AS nombre_completo
      FROM stock_items AS si
      JOIN marcas AS m ON si.marca_id = m.id
      JOIN categorias AS c ON m.categoria_id = c.id
      ${whereClause}
      ORDER BY c.nombre, m.nombre, si.variacion, si.equivalencia_ml
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

export const searchStockItems = async (req, res) => {
  try {
    const query = req.query.query || "";
    const limit = parseInt(req.query.limit) || 10;

    if (!query) {
      return res.json([]);
    }

    const searchQuery = `
     SELECT 
        si.id,
        CONCAT(
            m.nombre,
            CASE WHEN si.variacion IS NOT NULL AND si.variacion != '' THEN CONCAT(' ', si.variacion) ELSE '' END,
            ' ',
            si.equivalencia_ml, 'ml'
        ) AS nombre_completo
      FROM stock_items AS si
      JOIN marcas AS m ON si.marca_id = m.id
      WHERE si.is_active = TRUE 
        AND (
          m.nombre LIKE ? 
          OR si.equivalencia_ml LIKE ? 
          OR si.variacion LIKE ?
          OR CONCAT(
               m.nombre,
               CASE WHEN si.variacion IS NOT NULL AND si.variacion != '' THEN CONCAT(' ', si.variacion) ELSE '' END,
               ' ',
               si.equivalencia_ml, 'ml'
             ) LIKE ?
        )
      ORDER BY nombre_completo ASC
      LIMIT ?;
    `;

    const searchParams = [
      `%${query}%`,
      `%${query}%`,
      `%${query}%`,
      `%${query}%`,
      limit,
    ];
    const [rows] = await pool.query(searchQuery, searchParams);

    res.json(rows); // Devolvemos la lista de { id, nombre_completo }
  } catch (error) {
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
      [descripcionEvento]
    );
    const eventoId = eventoResult.insertId;

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

    // NUEVO: 1. Creamos el evento de AJUSTE
    const descEvento = descripcion || "Ajuste por conteo físico";
    const [eventoResult] = await connection.query(
      "INSERT INTO eventos_stock (tipo_evento, descripcion) VALUES ('AJUSTE', ?)",
      [descEvento]
    );
    const eventoId = eventoResult.insertId;

    if (cantidadMovida !== 0) {
      await connection.query(
        "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
        [conteoReal, itemId]
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
      [descEvento]
    );
    const eventoId = eventoResult.insertId;

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // 20 eventos por página
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereClause = "WHERE sm.id IS NOT NULL";
    const queryParams = [];

    if (searchQuery) {
      whereClause += " AND e.descripcion LIKE ?";
      queryParams.push(`%${searchQuery}%`);
    }

    // 1. Consulta para obtener el CONTEO TOTAL de eventos
    const countQuery = `
      SELECT COUNT(DISTINCT e.id) AS totalEventos
      FROM eventos_stock AS e
      LEFT JOIN stock_movements AS sm ON e.id = sm.evento_id
      ${whereClause};
    `;

    const [countRows] = await pool.query(countQuery, queryParams);
    const totalEventos = countRows[0].totalEventos;
    const totalPages = Math.ceil(totalEventos / limit);

    // 2. Consulta para obtener los EVENTOS PAGINADOS
    const dataQuery = `
      SELECT 
        e.id AS evento_id,
        e.tipo_evento,
        e.descripcion AS evento_descripcion,
        e.fecha_evento,
        COUNT(sm.id) AS items_afectados
      FROM eventos_stock AS e
      LEFT JOIN stock_movements AS sm ON e.id = sm.evento_id
      ${whereClause}
      GROUP BY e.id, e.tipo_evento, e.descripcion, e.fecha_evento
      ORDER BY e.fecha_evento DESC
      LIMIT ?
      OFFSET ?;
    `;

    const dataParams = [...queryParams, limit, offset];
    const [eventos] = await pool.query(dataQuery, dataParams);

    // 3. Devolver la respuesta estructurada
    res.json({
      eventos,
      pagination: {
        currentPage: page,
        totalPages,
        totalEventos,
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
  try {
    const query = `
      SELECT 
        e.id AS evento_id,
        e.tipo_evento,
        e.descripcion AS evento_descripcion,
        e.fecha_evento,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', sm.id,
            'nombre_item', CONCAT(m.nombre,
                CASE WHEN si.variacion IS NOT NULL AND si.variacion != '' THEN CONCAT(' ', si.variacion) ELSE '' END,
                ' ',
                si.equivalencia_ml, 'ml'),
            'cantidad_movida', sm.cantidad_unidades_movidas,
            'stock_anterior', sm.stock_anterior,
            'stock_nuevo', sm.stock_nuevo,
            'descripcion_movimiento', sm.descripcion
          )
        ) AS movimientos
      FROM eventos_stock AS e
      LEFT JOIN stock_movements AS sm ON e.id = sm.evento_id
      LEFT JOIN stock_items AS si ON sm.item_id = si.id
      LEFT JOIN marcas AS m ON si.marca_id = m.id
      WHERE e.id = ? AND sm.id IS NOT NULL 
      GROUP BY e.id, e.tipo_evento, e.descripcion, e.fecha_evento;
    `;
    const [rows] = await pool.query(query, [id]);
    if (rows.length === 0) {
      const [eventOnly] = await pool.query(
        "SELECT * FROM eventos_stock WHERE id = ?",
        [id]
      ); //
      if (eventOnly.length > 0) {
        // Devolver el evento sin movimientos si existe
        res.json({
          ...eventOnly[0],
          evento_descripcion: eventOnly[0].descripcion,
          movimientos: [],
        });
      } else {
        return res.status(404).json({ message: "Evento no encontrado." });
      }
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
    const query = `
      SELECT 
        m.nombre AS nombre_marca, 
        si.variacion,
        si.stock_unidades 
      FROM stock_items si
      JOIN marcas m ON si.marca_id = m.id
      JOIN categorias c ON m.categoria_id = c.id
      WHERE UPPER(c.nombre) = 'HIELO' AND si.is_active = TRUE;
    `;
    const [rows] = await pool.query(query); //
    // Construir nombre completo aquí si es necesario para el frontend
    const reportData = rows.map((item) => ({
      ...item,
      // Opcional: Construir un nombre más descriptivo si hay variaciones
      nombre_completo_hielo: buildNombreCompleto(
        item.nombre_marca,
        item.variacion,
        null
      ), // Equivalencia no aplica para el nombre aquí
    }));
    res.json(reportData);
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
    const buildAlertQuery = (condition) => `
      SELECT
        si.id,
        m.nombre as nombre_marca,
        si.variacion, -- <-- Incluir variación
        si.equivalencia_ml,
        si.stock_unidades,
        si.alerta_stock_bajo,
        -- Construcción dinámica del nombre completo
        CONCAT(
            m.nombre,
            CASE WHEN si.variacion IS NOT NULL AND si.variacion != '' THEN CONCAT(' ', si.variacion) ELSE '' END,
            ' ',
            si.equivalencia_ml, 'ml'
        ) AS nombre_item -- Renombrar a nombre_item para consistencia con frontend
      FROM stock_items si
      JOIN marcas m ON si.marca_id = m.id
      WHERE si.is_active = TRUE AND ${condition};
    `;

    const lowStockQuery = buildAlertQuery(
      "si.stock_unidades > 0 AND si.stock_unidades <= si.alerta_stock_bajo"
    );
    const [lowStockItems] = await pool.query(lowStockQuery); //

    const outOfStockQuery = buildAlertQuery("si.stock_unidades <= 0");
    const [outOfStockItems] = await pool.query(outOfStockQuery); //

    // Ya no necesitamos formatItems porque el nombre se construye en SQL
    res.json({
      lowStock: lowStockItems,
      outOfStock: outOfStockItems,
    });
  } catch (error) {
    console.error("Error al obtener alertas de stock:", error);
    res.status(500).json({
      message: "Error al obtener alertas de stock.",
      error: error.message,
    });
  }
};

export const registerProduction = async (req, res) => {
  const { productId, quantityProduced, description } = req.body;

  // 1. Validar entradas
  if (
    !productId ||
    !quantityProduced ||
    !description ||
    quantityProduced <= 0
  ) {
    return res.status(400).json({
      message:
        "Faltan datos (Producto, Cantidad > 0, Descripción) o son inválidos.",
    });
  }

  let connection;
  try {
    console.log(
      `Iniciando registro de producción para Producto ID: ${productId}, Cantidad: ${quantityProduced}`
    );
    connection = await pool.getConnection(); //
    await connection.beginTransaction();
    console.log("Transacción iniciada.");

    // 2. Crear evento de PRODUCCION
    const [eventoResult] = await connection.query(
      "INSERT INTO eventos_stock (tipo_evento, descripcion) VALUES ('PRODUCCION', ?)",
      [description]
    );
    const eventoId = eventoResult.insertId;
    console.log(`Evento PRODUCCION creado con ID: ${eventoId}`);

    // 3. Obtener la receta del productoId
    const [reglasReceta] = await connection.query(
      // Traemos marca_id y consumo_ml distintos para cada marca involucrada
      `SELECT DISTINCT
            r.marca_id,
            r.consumo_ml,
            m.nombre AS nombre_marca -- Necesario para mensajes de error
          FROM recetas r
          JOIN marcas m ON r.marca_id = m.id
          WHERE r.producto_id = ?`,
      [productId]
    );

    if (reglasReceta.length === 0) {
      throw new Error(
        `No se encontró receta activa o válida para el producto ID ${productId}.`
      );
    }
    console.log(
      `Receta encontrada con ${reglasReceta.length} marca(s) de ingredientes.`
    );

    // 4. Bucle por cada *tipo* de ingrediente (marca_id) en la receta
    for (const regla of reglasReceta) {
      let consumoTotalMl = regla.consumo_ml * quantityProduced;
      console.log(
        `Procesando ingrediente Marca ID: ${regla.marca_id} (${regla.nombre_marca}). Consumo total requerido: ${consumoTotalMl}ml`
      );

      if (consumoTotalMl <= 0) {
        console.log(`Consumo 0ml para Marca ID: ${regla.marca_id}. Saltando.`);
        continue; // Saltar si el consumo es 0
      }

      // 5. Obtener items priorizados para esta marca_id
      const [itemsPriorizados] = await connection.query(
        `SELECT
             r.item_id,
             si.stock_unidades,
             si.variacion,
             si.equivalencia_ml,
             m.nombre as nombre_marca
           FROM recetas r
           JOIN stock_items si ON r.item_id = si.id
           JOIN marcas m ON si.marca_id = m.id
           WHERE r.producto_id = ? AND r.marca_id = ? AND si.stock_unidades > 0 AND si.is_active = TRUE
           ORDER BY r.prioridad_item ASC`, // Usa la prioridad definida en la receta
        [productId, regla.marca_id]
      );

      console.log(
        `Encontrados ${itemsPriorizados.length} items activos con stock para Marca ID: ${regla.marca_id}`
      );

      // 6. Bucle por los items encontrados para descontar
      for (const item of itemsPriorizados) {
        if (consumoTotalMl <= 0.001) break; // Tolerancia para punto flotante

        console.log(
          `Intentando descontar del Item ID: ${
            item.item_id
          } (${buildNombreCompleto(
            item.nombre_marca,
            item.variacion,
            item.equivalencia_ml
          )})`
        );

        const stockDisponibleEnMl = item.stock_unidades * item.equivalencia_ml;
        const aDescontarDeEsteItemEnMl = Math.min(
          consumoTotalMl,
          stockDisponibleEnMl
        );

        if (item.equivalencia_ml <= 0) {
          console.warn(
            `Advertencia: Equivalencia inválida (${item.equivalencia_ml}) para item ID ${item.item_id}. Saltando este item.`
          );
          continue; // Evitar división por cero
        }
        const aDescontarEnUnidades =
          aDescontarDeEsteItemEnMl / item.equivalencia_ml;

        // Obtener stock actual con bloqueo
        const [stockActualRows] = await connection.query(
          "SELECT stock_unidades FROM stock_items WHERE id = ? FOR UPDATE",
          [item.item_id]
        );
        if (stockActualRows.length === 0) {
          // Esto no debería ocurrir si la consulta anterior lo encontró
          throw new Error(
            `Item ID ${item.item_id} no encontrado durante la actualización de stock.`
          );
        }

        const stockAnterior = stockActualRows[0].stock_unidades;
        const stockNuevo = stockAnterior - aDescontarEnUnidades;
        console.log(
          `   Stock Anterior: ${stockAnterior.toFixed(
            3
          )}, A descontar: ${aDescontarEnUnidades.toFixed(
            3
          )}, Stock Nuevo (calculado): ${stockNuevo.toFixed(3)}`
        );

        // Verificar stock suficiente con tolerancia
        if (stockNuevo < -0.001) {
          const nombreCompletoItemError = buildNombreCompleto(
            item.nombre_marca,
            item.variacion,
            item.equivalencia_ml
          );
          throw new Error(
            `Stock insuficiente para "${nombreCompletoItemError}" (ID: ${
              item.item_id
            }). Necesita descontar: ${aDescontarEnUnidades.toFixed(
              3
            )}, Disponible: ${stockAnterior.toFixed(3)}`
          );
        }
        // Redondear stock nuevo para evitar problemas de precisión flotante
        const stockNuevoRedondeado = parseFloat(stockNuevo.toFixed(5));
        console.log(`   Stock Nuevo (redondeado): ${stockNuevoRedondeado}`);

        // Actualizar stock_items
        await connection.query(
          "UPDATE stock_items SET stock_unidades = ? WHERE id = ?",
          [stockNuevoRedondeado, item.item_id]
        );
        console.log(`   Stock actualizado para Item ID: ${item.item_id}`);

        // Crear descripción para el movimiento
        const nombreCompletoItemDesc = buildNombreCompleto(
          item.nombre_marca,
          item.variacion,
          item.equivalencia_ml
        );
        // Usar la descripción general del evento como base para el movimiento
        const descripcionMovimiento = `${description} (Consumo: ${nombreCompletoItemDesc})`;

        // Insertar stock_movements
        await connection.query(
          `INSERT INTO stock_movements (item_id, tipo_movimiento, cantidad_unidades_movidas, stock_anterior, stock_nuevo, descripcion, evento_id) VALUES (?, 'CONSUMO_PRODUCCION', ?, ?, ?, ?, ?)`,
          [
            item.item_id,
            -aDescontarEnUnidades, // Cantidad negativa porque es consumo
            stockAnterior,
            stockNuevoRedondeado,
            descripcionMovimiento,
            eventoId, // ID del evento 'PRODUCCION'
          ]
        );
        console.log(`   Movimiento registrado para Item ID: ${item.item_id}`);

        // Restar de consumoTotalMl
        consumoTotalMl -= aDescontarDeEsteItemEnMl;
        console.log(
          `   Consumo restante para Marca ID ${
            regla.marca_id
          }: ${consumoTotalMl.toFixed(3)}ml`
        );
      } // Fin bucle itemsPriorizados

      // Verificar si quedó consumo pendiente después de intentar con todos los items disponibles
      if (consumoTotalMl > 0.01) {
        // Tolerancia mayor aquí
        console.error(
          `Stock insuficiente final para Marca ID: ${regla.marca_id} (${regla.nombre_marca})`
        );
        throw new Error(
          `Stock insuficiente para la marca "${
            regla.nombre_marca
          }" al registrar producción. Faltaron ${consumoTotalMl.toFixed(
            2
          )}ml por descontar.`
        );
      } else {
        console.log(`Consumo completado para Marca ID: ${regla.marca_id}`);
      }
    } // Fin bucle reglasReceta

    console.log("Intentando commit final...");
    await connection.commit();
    console.log("Commit final exitoso.");

    res.status(200).json({
      message:
        "Producción registrada y stock de ingredientes descontado con éxito.",
    });
  } catch (error) {
    console.error("--- ERROR en registerProduction ---:", error); // Loggear el error completo
    if (connection) {
      console.log("Intentando rollback...");
      await connection.rollback();
      console.log("Rollback realizado.");
    }
    // Devolver el mensaje de error específico
    res.status(500).json({
      message:
        error.message ||
        "Error interno del servidor al registrar la producción.", // Usar el mensaje del error lanzado
      error: error.message,
    });
  } finally {
    if (connection) {
      console.log("Liberando conexión...");
      connection.release();
      console.log("Conexión liberada.");
    }
    console.log("--- Finalizando registerProduction ---");
  }
};
