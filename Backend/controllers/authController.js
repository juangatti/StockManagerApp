import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// POST /api/auth/register
export const registerUser = async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Usuario y contraseña son obligatorios." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, hashedPassword, role || "operator"]
    );

    res
      .status(201)
      .json({ message: "Usuario creado con éxito.", userId: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "El nombre de usuario ya existe." });
    }
    res.status(500).json({ message: "Error al registrar el usuario." });
  }
};

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    // MODIFICADO: Hacemos JOIN para obtener los nuevos campos
    const [users] = await pool.query(
      `SELECT 
        u.id, u.username, u.password, u.role, 
        u.display_name,
        d.full_name
       FROM users u
       LEFT JOIN employee_details d ON u.id = d.user_id
       WHERE u.username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    // MODIFICADO: Añadir nuevos campos al payload del token
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        display_name: user.display_name, // <-- NUEVO
        full_name: user.full_name, // <-- NUEVO
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    // Devolvemos el objeto user completo (sin el password)
    const userResponse = {
      id: user.id,
      username: user.username,
      role: user.role,
      display_name: user.display_name, // <-- NUEVO
      full_name: user.full_name, // <-- NUEVO
    };

    res.json({ token, user: userResponse });
  } catch (error) {
    res.status(500).json({ message: "Error del servidor." });
  }
};

export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // Viene del middleware 'protect'

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Debes ingresar la contraseña actual y la nueva." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      message: "La nueva contraseña debe tener al menos 6 caracteres.",
    });
  }

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    const user = users[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "La contraseña actual es incorrecta." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    res.json({ message: "Contraseña actualizada con éxito." });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Error al actualizar la contraseña." });
  }
};
