import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// POST /api/auth/login
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. OBTENER DATOS DEL USUARIO Y SU ROL
    // Hacemos JOIN con 'users', 'employee_details' y 'roles'
    const [users] = await pool.query(
      `SELECT 
        u.id, u.username, u.password, u.is_active,
        u.display_name,
        r.id as role_id,
        r.name as role_name,
        d.full_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN employee_details d ON u.id = d.user_id
       WHERE u.username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }
    const user = users[0];

    // 2. VALIDAR SI ESTÁ ACTIVO (SOFT DELETE)
    if (!user.is_active) {
      return res
        .status(403)
        .json({ message: "Este usuario ha sido desactivado." });
    }

    // 3. VALIDAR CONTRASEÑA
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    // 4. OBTENER PERMISOS DEL ROL
    let permissions = [];
    if (user.role_id) {
      const [permRows] = await pool.query(
        `SELECT p.permission_key
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = ?`,
        [user.role_id]
      );
      permissions = permRows.map((p) => p.permission_key);
    }
    // Si permissions incluye 'all' (ej. SuperAdmin), dale todos los permisos (lógica futura)
    // Por ahora, solo cargamos los que tiene.

    // 5. CONSTRUIR PAYLOAD DEL TOKEN Y RESPUESTA
    const userPayload = {
      id: user.id,
      username: user.username,
      role_id: user.role_id,
      role_name: user.role_name,
      display_name: user.display_name,
      full_name: user.full_name,
      permissions: permissions, // <-- ¡Guardamos los permisos en el token!
    };

    const token = jwt.sign({ user: userPayload }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    res.json({ token, user: userPayload }); // Devolvemos el mismo payload
  } catch (error) {
    console.error("Error en loginUser:", error);
    res.status(500).json({ message: "Error del servidor." });
  }
};

export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

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
