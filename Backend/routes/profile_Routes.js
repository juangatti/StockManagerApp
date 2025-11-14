// Backend/routes/profile_Routes.js
import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Protegemos TODAS las rutas de este archivo
router.use(protect);

// Definimos las rutas
router.get("/", getProfile);
router.put("/", updateProfile);

export default router;
