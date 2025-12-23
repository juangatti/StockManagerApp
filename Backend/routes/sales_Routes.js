import { Router } from "express";
import multer from "multer";
import { processSalesFile } from "../controllers/salesController.js";
import { protect, authorize } from "../middleware/authMiddleware.js"; // <--- 1. Importar seguridad

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 2. Proteger todas las rutas
router.use(protect);

router.post(
  "/salesProcessor",
  authorize("sales:upload"), // <--- 3. Exigir permiso específico
  upload.single("archivoVentas"),
  processSalesFile
);

export default router;
