// Backend/controllers/profileController.js
import pool from "../config/db.js";

// GET /api/profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Viene del middleware 'protect'

    // Hacemos un JOIN para obtener datos de 'users', 'employee_details' y 'roles'
    const [rows] = await pool.query(
      `SELECT
        u.username,
        r.name as role_name,
        u.display_name,
        d.full_name,
        d.email_contact,
        d.phone
      FROM users u
      LEFT JOIN employee_details d ON u.id = d.user_id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    // Devolvemos los datos (si no hay 'employee_details', los campos vendrán como null)
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res
      .status(500)
      .json({ message: "Error del servidor al obtener el perfil." });
  }
};

// PUT /api/profile
export const updateProfile = async (req, res) => {
  let connection;
  try {
    const userId = req.user.id; // Viene del middleware 'protect'
    const { display_name, full_name, email_contact, phone } = req.body;

    // Usaremos una transacción porque actualizamos DOS tablas
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Actualizar la tabla 'users' (solo el 'display_name')
    await connection.query("UPDATE users SET display_name = ? WHERE id = ?", [
      display_name,
      userId,
    ]);

    // 2. Actualizar (o Insertar) la tabla 'employee_details'
    // 'ON DUPLICATE KEY UPDATE' es un atajo de MySQL que hace un INSERT
    // si la 'user_id' no existe, o un UPDATE si ya existe.
    await connection.query(
      `INSERT INTO employee_details (user_id, full_name, email_contact, phone)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         email_contact = VALUES(email_contact),
         phone = VALUES(phone)`,
      [userId, full_name, email_contact, phone]
    );

    await connection.commit();

    // Devolvemos los datos actualizados para que el frontend (Zustand) pueda refrescarse
    const updatedProfile = {
      display_name,
      full_name,
      email_contact,
      phone,
    };
    res.json({
      message: "Perfil actualizado con éxito.",
      profile: updatedProfile,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error al actualizar el perfil." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
