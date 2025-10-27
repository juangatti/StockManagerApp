// Backend/controllers/prebatchController.js
import pool from "../config/db.js";
import { buildNombreCompleto } from "../utils/helpers.js"; //

// GET /api/prebatches
export const getAllPrebatches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereClause = "WHERE is_active = TRUE";
    const queryParams = [];

    if (searchQuery) {
      whereClause += " AND nombre_prebatch LIKE ?";
      queryParams.push(`%${searchQuery}%`);
    }

    // Consulta de Conteo (sin cambios)
    const countQuery = `
      SELECT COUNT(id) AS totalPrebatches
      FROM prebatches
      ${whereClause};
    `;
    const [countRows] = await pool.query(countQuery, queryParams); //
    const totalPrebatches = countRows[0].totalPrebatches;
    const totalPages = Math.ceil(totalPrebatches / limit);

    // Consulta de Datos Paginados (CASE MODIFICADO)
    const dataQuery = `
      SELECT id, nombre_prebatch, fecha_produccion, fecha_vencimiento, cantidad_actual_ml, identificador_lote,
        CASE
          -- Lógica con fecha de vencimiento manual (Aviso 7 días antes)
          WHEN fecha_vencimiento IS NOT NULL AND CURDATE() >= fecha_vencimiento THEN 'VENCIDO'
          WHEN fecha_vencimiento IS NOT NULL AND CURDATE() >= DATE_SUB(fecha_vencimiento, INTERVAL 7 DAY) THEN 'ADVERTENCIA'

          -- Lógica original (fallback si no hay fecha manual - 14/28 días desde producción)
          WHEN fecha_vencimiento IS NULL AND CURDATE() >= DATE_ADD(fecha_produccion, INTERVAL 28 DAY) THEN 'VENCIDO'
          WHEN fecha_vencimiento IS NULL AND CURDATE() >= DATE_ADD(fecha_produccion, INTERVAL 14 DAY) THEN 'ADVERTENCIA'

          -- Por defecto
          ELSE 'FRESCO'
        END AS estado
      FROM prebatches
      ${whereClause}
      ORDER BY fecha_produccion ASC -- Puedes cambiar a ORDER BY estado, fecha_vencimiento, fecha_produccion si prefieres
      LIMIT ?
      OFFSET ?;
    `;
    const dataParams = [...queryParams, limit, offset];
    const [prebatches] = await pool.query(dataQuery, dataParams); //

    res.json({
      prebatches,
      pagination: {
        currentPage: page,
        totalPages,
        totalPrebatches,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching prebatches:", error); // Añadir log
    res.status(500).json({ message: "Error al obtener prebatches." });
  }
};

export const getPrebatchNames = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT nombre_prebatch
      FROM prebatches
      WHERE is_active = TRUE
      ORDER BY nombre_prebatch ASC;
    `;
    const [rows] = await pool.query(query); //
    // Devolver solo un array de strings (nombres)
    const names = rows.map((row) => row.nombre_prebatch);
    res.json(names);
  } catch (error) {
    console.error("Error fetching distinct prebatch names:", error);
    res
      .status(500)
      .json({ message: "Error al obtener nombres de prebatches." });
  }
};

// GET /api/prebatches/totals
export const getPrebatchTotals = async (req, res) => {
  try {
    const query = `
        SELECT nombre_prebatch, SUM(cantidad_actual_ml) / 1000 AS total_litros
        FROM prebatches
        WHERE is_active = TRUE -- Solo activos
        GROUP BY nombre_prebatch
        ORDER BY nombre_prebatch;
      `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener totales de prebatches." });
  }
};

// POST /api/prebatches
export const createPrebatch = async (req, res) => {
  const {
    nombre_prebatch,
    fecha_produccion,
    cantidad_inicial_ml,
    identificador_lote,
  } = req.body;
  if (!nombre_prebatch || !fecha_produccion || !cantidad_inicial_ml) {
    return res
      .status(400)
      .json({ message: "Nombre, fecha y cantidad son obligatorios." });
  }
  try {
    await pool.query(
      "INSERT INTO prebatches (nombre_prebatch, fecha_produccion, cantidad_inicial_ml, cantidad_actual_ml, identificador_lote) VALUES (?, ?, ?, ?, ?)",
      [
        nombre_prebatch,
        fecha_produccion,
        cantidad_inicial_ml,
        cantidad_inicial_ml,
        identificador_lote || null,
      ]
    );
    res.status(201).json({ message: "Prebatch creado con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al crear el prebatch." });
  }
};

// PUT /api/prebatches/:id
export const updatePrebatch = async (req, res) => {
  const { id } = req.params;
  // 1. Extraer categoria_id del body
  const {
    nombre_prebatch,
    fecha_produccion,
    cantidad_inicial_ml,
    identificador_lote,
    categoria_id, // <-- Nuevo campo extraído
  } = req.body;

  // Validación básica (puedes añadir más si es necesario)
  if (!nombre_prebatch || !fecha_produccion || !cantidad_inicial_ml) {
    return res
      .status(400)
      .json({ message: "Nombre, fecha y cantidad inicial son obligatorios." });
  }

  try {
    // 2. Modificar la consulta UPDATE para incluir categoria_id
    await pool.query(
      `UPDATE prebatches SET
        nombre_prebatch = ?,
        fecha_produccion = ?,
        cantidad_inicial_ml = ?,
        identificador_lote = ?,
        categoria_id = ?
       WHERE id = ?`,
      [
        nombre_prebatch,
        fecha_produccion,
        cantidad_inicial_ml,
        identificador_lote || null,
        categoria_id || null, // <-- Usar el valor o null si no viene
        id,
      ]
    );
    res.status(200).json({ message: "Prebatch actualizado con éxito." });
  } catch (error) {
    console.error("Error updating prebatch:", error); // Añadir log
    res.status(500).json({ message: "Error al actualizar el prebatch." });
  }
};

// DELETE /api/prebatches/:id (Soft Delete)
export const deletePrebatch = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE prebatches SET is_active = FALSE WHERE id = ?", [
      id,
    ]);
    res.status(200).json({ message: "Prebatch desactivado con éxito." });
  } catch (error) {
    res.status(500).json({ message: "Error al desactivar el prebatch." });
  }
};

export const findPrebatchByName = async (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res
      .status(400)
      .json({ message: "Se requiere el parámetro 'name'." });
  }
  try {
    const query =
      "SELECT id, nombre_prebatch FROM prebatches WHERE nombre_prebatch = ? AND is_active = TRUE LIMIT 1";
    const [rows] = await pool.query(query, [name]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.json(null); // O res.status(404).json({ message: 'No encontrado' }); según prefieras
    }
  } catch (error) {
    console.error("Error finding prebatch by name:", error);
    res.status(500).json({ message: "Error al buscar prebatch." });
  }
};
