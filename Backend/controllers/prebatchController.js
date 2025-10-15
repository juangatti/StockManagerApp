// Backend/controllers/prebatchController.js
import pool from "../config/db.js";

// GET /api/prebatches
export const getAllPrebatches = async (req, res) => {
  try {
    const query = `
      SELECT *, CASE
          WHEN CURDATE() >= DATE_ADD(fecha_produccion, INTERVAL 28 DAY) THEN 'VENCIDO'
          WHEN CURDATE() >= DATE_ADD(fecha_produccion, INTERVAL 14 DAY) THEN 'ADVERTENCIA'
          ELSE 'FRESCO'
        END AS estado
      FROM prebatches
      WHERE is_active = TRUE -- Solo activos
      ORDER BY fecha_produccion ASC;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener prebatches." });
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
