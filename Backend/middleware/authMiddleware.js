import jwt from "jsonwebtoken";

// Middleware para verificar si el usuario tiene un token válido
export const protect = (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Adjuntamos todo el objeto 'user' (que ahora tiene role_id y permisos)
      req.user = decoded.user;

      next();
    } catch (error) {
      res.status(401).json({ message: "Token no válido." });
    }
  }
  if (!token) {
    res.status(401).json({ message: "No autorizado, sin token." });
  }
};

// Middleware para verificar si el usuario tiene el rol permitido
export const authorize = (permissionKey) => {
  return (req, res, next) => {
    // 1. Obtenemos los permisos del usuario (que adjuntamos en el token durante el login)
    const userPermissions = req.user.permissions || [];

    // 2. Comprobamos si el permiso requerido (ej. 'users:create')
    //    está en la lista de permisos que tiene el usuario.
    if (userPermissions.includes(permissionKey)) {
      next(); // ¡Permitido! Pasa al siguiente middleware o controlador.
    } else {
      // 3. Si no tiene el permiso, denegar acceso.
      return res.status(403).json({
        message: `Acción no autorizada. Requiere el permiso: ${permissionKey}`,
      });
    }
  };
};
