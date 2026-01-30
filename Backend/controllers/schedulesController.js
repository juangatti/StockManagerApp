import pool from "../config/db.js";

// GET /api/schedules/dashboard
// Obtener horarios de HOY y configuración del bar para el dashboard
export const getDashboardSchedules = async (req, res) => {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
    const dayOfWeek = today.getDay(); // 0-6

    // 1. Horarios de trabajadores para hoy
    const scheduleQuery = `
      SELECT 
        ws.id,
        ws.worker_id,
        ws.start_time,
        ws.end_time,
        ws.notes,
        w.full_name,
        r.name as role_name
      FROM work_schedules ws
      JOIN workers w ON ws.worker_id = w.id
      LEFT JOIN roles r ON w.role_id = r.id
      WHERE ws.work_date = ?
      ORDER BY ws.start_time ASC
    `;

    // 2. Configuración del bar para hoy
    const barConfigQuery = `
      SELECT * FROM bar_config WHERE day_of_week = ?
    `;

    const [schedules] = await pool.query(scheduleQuery, [dateStr]);
    const [barConfig] = await pool.query(barConfigQuery, [dayOfWeek]);

    res.json({
      schedules,
      barConfig: barConfig[0] || null,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Error al obtener datos del dashboard." });
  }
};

// GET /api/schedules
export const getSchedules = async (req, res) => {
  try {
    const { startDate, endDate, workerId } = req.query;

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
    if (workerId) {
      whereClause += " AND ws.worker_id = ?";
      queryParams.push(workerId);
    }

    const query = `
      SELECT 
        ws.*,
        w.full_name,
        r.name as role_name
      FROM work_schedules ws
      JOIN workers w ON ws.worker_id = w.id
      LEFT JOIN roles r ON w.role_id = r.id
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
export const createSchedule = async (req, res) => {
  const { worker_id, work_date, start_time, end_time, notes } = req.body;

  if (!worker_id || !work_date || !start_time || !end_time) {
    return res.status(400).json({ message: "Faltan datos obligatorios." });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO work_schedules (worker_id, work_date, start_time, end_time, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [worker_id, work_date, start_time, end_time, notes || null],
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

// --- TRABAJADORES (WORKERS) ---

export const getWorkers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT w.*, r.name as role_name 
      FROM workers w 
      LEFT JOIN roles r ON w.role_id = r.id 
      WHERE w.is_active = TRUE 
      ORDER BY w.full_name ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener trabajadores." });
  }
};

export const createWorker = async (req, res) => {
  const { full_name, role_id } = req.body;
  if (!full_name) return res.status(400).json({ message: "Nombre requerido." });
  try {
    const [result] = await pool.query(
      "INSERT INTO workers (full_name, role_id) VALUES (?, ?)",
      [full_name, role_id || null],
    );
    res
      .status(201)
      .json({ id: result.insertId, message: "Trabajador creado." });
  } catch (error) {
    res.status(500).json({ message: "Error al crear trabajador." });
  }
};

// --- CONFIGURACIÓN DEL BAR (OPERATING HOURS) ---

export const getBarConfig = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM bar_config ORDER BY day_of_week ASC",
    );
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener configuración del bar." });
  }
};

export const updateBarConfig = async (req, res) => {
  const { day_of_week, opening_time, kitchen_close_time, bar_close_time } =
    req.body;
  try {
    await pool.query(
      `INSERT INTO bar_config (day_of_week, opening_time, kitchen_close_time, bar_close_time)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         opening_time = VALUES(opening_time),
         kitchen_close_time = VALUES(kitchen_close_time),
         bar_close_time = VALUES(bar_close_time)`,
      [day_of_week, opening_time, kitchen_close_time, bar_close_time],
    );
    res.json({ message: "Configuración actualizada." });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar configuración." });
  }
};
