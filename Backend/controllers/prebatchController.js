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
  const {
    nombre_prebatch,
    fecha_produccion,
    cantidad_inicial_ml,
    identificador_lote,
  } = req.body;
  try {
    // Nota: Al editar, decidimos no cambiar la cantidad actual para no perder el tracking.
    // Si se necesita reajustar, se debe hacer desde la sección de Ajustes.
    await pool.query(
      "UPDATE prebatches SET nombre_prebatch = ?, fecha_produccion = ?, cantidad_inicial_ml = ?, identificador_lote = ? WHERE id = ?",
      [
        nombre_prebatch,
        fecha_produccion,
        cantidad_inicial_ml,
        identificador_lote || null,
        id,
      ]
    );
    res.status(200).json({ message: "Prebatch actualizado con éxito." });
  } catch (error) {
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
