import pool from "../config/db.js";

// GET /api/reservations
export const getReservations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const date = req.query.date || ""; // Fecha específica YYYY-MM-DD
    const offset = (page - 1) * limit;

    let whereClause = "WHERE status != 'DELETED'"; // Asumimos Soft Delete o simplemente no mostramos 'DELETED'
    // Si prefieres mostrar todas y filtrar por estado, ajusta aquí.
    // Por ahora mostremos todas las activas (Pendientes, Confirmadas, Completadas, Canceladas)

    const queryParams = [];

    if (search) {
      whereClause += " AND (customer_name LIKE ? OR location LIKE ?)";
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (date) {
      // Filtrar por día exacto
      whereClause += " AND DATE(reservation_date) = ?";
      queryParams.push(date);
    }

    // Ordenar por fecha (más próximas primero)
    const dataQuery = `
      SELECT * FROM reservations
      ${whereClause}
      ORDER BY reservation_date ASC
      LIMIT ? OFFSET ?
    `;

    // Count para paginación
    const countQuery = `SELECT COUNT(id) as total FROM reservations ${whereClause}`;

    const [rows] = await pool.query(dataQuery, [...queryParams, limit, offset]);
    const [countResult] = await pool.query(countQuery, queryParams);

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      reservations: rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ message: "Error al obtener reservas." });
  }
};

// POST /api/reservations
// Helper to check for location conflicts
// existingReservations: array of rows from DB
// newLocations: array of strings ["Salon 1", "Salon 2"]
// ignoreId: (optional) ID of the reservation being updated, to ignore self-conflict
const hasLocationConflict = (
  existingReservations,
  newLocations,
  ignoreId = null
) => {
  for (const res of existingReservations) {
    if (ignoreId && res.id === parseInt(ignoreId)) continue;
    if (!res.location) continue;

    // Split existing locations (handled as comma-separated string)
    const existingLocs = res.location.split(",").map((l) => l.trim());

    // Check intersection
    const conflict = existingLocs.some((l) => newLocations.includes(l));
    if (conflict) return true;
  }
  return false;
};

// POST /api/reservations
export const createReservation = async (req, res) => {
  const { customer_name, pax, reservation_date, location, notes } = req.body;
  const created_by = req.user ? req.user.id : null;

  if (!customer_name || !pax || !reservation_date) {
    return res.status(400).json({
      message: "Nombre, cantidad de personas y fecha son obligatorios.",
    });
  }

  try {
    // 1. Validate Location Conflicts
    if (location) {
      // Parse new locations
      // Si viene como array, úsalo. Si es string, split.
      const requestedLocations = Array.isArray(location)
        ? location
        : location
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean);

      if (requestedLocations.length > 0) {
        // Extract date strictly YYYY-MM-DD for comparison
        // Assuming reservation_date is ISO string or "YYYY-MM-DD"
        const dateOnly = reservation_date.split("T")[0];

        // Fetch all active reservations for this date
        // Note: Using a broader query to get all potential conflicts
        const [existing] = await pool.query(
          `SELECT id, location FROM reservations 
           WHERE DATE(reservation_date) = ? AND status != 'CANCELLED' AND status != 'DELETED'`,
          [dateOnly]
        );

        if (hasLocationConflict(existing, requestedLocations)) {
          return res.status(400).json({
            message:
              "Una o más ubicaciones seleccionadas ya están ocupadas para esta fecha.",
          });
        }
      }
    }

    const [result] = await pool.query(
      `INSERT INTO reservations (customer_name, pax, reservation_date, location, notes, status, created_by)
       VALUES (?, ?, ?, ?, ?, 'CONFIRMED', ?)`,
      [customer_name, pax, reservation_date, location, notes, created_by]
    );

    res
      .status(201)
      .json({ message: "Reserva creada con éxito.", id: result.insertId });
  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(500).json({ message: "Error al crear la reserva." });
  }
};

// PUT /api/reservations/:id
export const updateReservation = async (req, res) => {
  const { id } = req.params;
  const { customer_name, pax, reservation_date, location, notes, status } =
    req.body;

  if (!customer_name || !pax || !reservation_date || !status) {
    return res.status(400).json({ message: "Incomplete data for update." });
  }

  try {
    // 1. Validate Location Conflicts (same logic as create)
    if (location) {
      const requestedLocations = Array.isArray(location)
        ? location
        : location
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean);

      if (requestedLocations.length > 0) {
        const dateOnly = reservation_date.split("T")[0];

        const [existing] = await pool.query(
          `SELECT id, location FROM reservations 
           WHERE DATE(reservation_date) = ? AND status != 'CANCELLED' AND status != 'DELETED'`,
          [dateOnly]
        );

        // Pass 'id' to ignore self-conflict
        if (hasLocationConflict(existing, requestedLocations, id)) {
          return res.status(400).json({
            message:
              "Una o más ubicaciones seleccionadas ya están ocupadas para esta fecha.",
          });
        }
      }
    }

    await pool.query(
      `UPDATE reservations
       SET customer_name = ?, pax = ?, reservation_date = ?, location = ?, notes = ?, status = ?
       WHERE id = ?`,
      [customer_name, pax, reservation_date, location, notes, status, id]
    );

    res.json({ message: "Reserva actualizada." });
  } catch (error) {
    console.error("Error updating reservation:", error);
    res.status(500).json({ message: "Error al actualizar la reserva." });
  }
};

// DELETE /api/reservations/:id (Soft Delete o Cancel)
export const deleteReservation = async (req, res) => {
  const { id } = req.params;
  try {
    // Opción A: Hard Delete
    // await pool.query("DELETE FROM reservations WHERE id = ?", [id]);

    // Opción B: Soft Delete (cambiar estado a CANCELLED)
    await pool.query(
      "UPDATE reservations SET status = 'CANCELLED' WHERE id = ?",
      [id]
    );

    res.json({ message: "Reserva cancelada." });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    res.status(500).json({ message: "Error al eliminar la reserva." });
  }
};

// GET /api/reservations/stats/dashboard
// Retorna reservas de HOY para el dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const [rows] = await pool.query(
      `SELECT * FROM reservations 
       WHERE DATE(reservation_date) = ? AND status IN ('CONFIRMED', 'PENDING')
       ORDER BY reservation_date ASC`,
      [today]
    );

    const totalPax = rows.reduce((acc, curr) => acc + curr.pax, 0);

    res.json({
      today_reservations: rows,
      count: rows.length,
      totalPax,
    });
  } catch (error) {
    console.error("Error fetching dashboard reservation stats:", error);
    res
      .status(500)
      .json({ message: "Error al obtener estadísticas de reservas." });
  }
};
