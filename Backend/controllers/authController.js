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

// POST /api/auth/login
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    const payload = {
      user: { id: user.id, username: user.username, role: user.role },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    res.json({ token, user: payload.user });
  } catch (error) {
    res.status(500).json({ message: "Error del servidor." });
  }
};
