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
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `El rol '${req.user.role}' no tiene permiso para esta acción.`,
      });
    }
    next();
  };
};
