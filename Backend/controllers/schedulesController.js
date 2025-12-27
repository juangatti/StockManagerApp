import pool from "../config/db.js";

// GET /api/schedules/dashboard
// Obtener horarios de HOY para el dashboard
export const getDashboardSchedules = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const query = `
      SELECT 
        ws.id,
        ws.user_id,
        ws.start_time,
        ws.end_time,
        ws.notes,
        u.display_name,
        d.full_name,
        r.name as role_name
      FROM work_schedules ws
      JOIN users u ON ws.user_id = u.id
      LEFT JOIN employee_details d ON u.id = d.user_id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE ws.work_date = ?
      ORDER BY ws.start_time ASC
    `;

    const [rows] = await pool.query(query, [today]);

    res.json(rows);
  } catch (error) {
    console.error("Error fetching dashboard schedules:", error);
    res
      .status(500)
      .json({ message: "Error al obtener horarios del dashboard." });
  }
};

// GET /api/schedules
// Obtener horarios con filtros (startDate, endDate, userId)
export const getSchedules = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    let whereClause = "WHERE 1=1";
    const queryParams = [];

    if (startDate) {
      whereClause += " AND ws.work_date >= ?";
      queryParams.push(startDate);
    }
    if (endDate) {
      whereClause += " AND ws.work_date <= ?";
      queryParams.push(endDate);
    }
    if (userId) {
      whereClause += " AND ws.user_id = ?";
      queryParams.push(userId);
    }

    const query = `
      SELECT 
        ws.*,
        u.display_name,
        d.full_name
      FROM work_schedules ws
      JOIN users u ON ws.user_id = u.id
      LEFT JOIN employee_details d ON u.id = d.user_id
      ${whereClause}
      ORDER BY ws.work_date ASC, ws.start_time ASC
    `;

    const [rows] = await pool.query(query, queryParams);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ message: "Error al obtener horarios." });
  }
};

// POST /api/schedules
// Crear o Asignar horario
export const createSchedule = async (req, res) => {
  const { user_id, work_date, start_time, end_time, notes } = req.body;

  if (!user_id || !work_date || !start_time || !end_time) {
    return res.status(400).json({ message: "Faltan datos obligatorios." });
  }

  try {
    // Validar si ya existe horario para ese user en esa fecha (Opcional: permitir múltiples turnos)
    // Por simplicidad, permitimos múltiples turnos.

    const [result] = await pool.query(
      `INSERT INTO work_schedules (user_id, work_date, start_time, end_time, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, work_date, start_time, end_time, notes || null]
    );

    res.status(201).json({ message: "Horario asignado.", id: result.insertId });
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).json({ message: "Error al asignar horario." });
  }
};

// DELETE /api/schedules/:id
export const deleteSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM work_schedules WHERE id = ?", [id]);
    res.json({ message: "Horario eliminado." });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ message: "Error al eliminar horario." });
  }
};
