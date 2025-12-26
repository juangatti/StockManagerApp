import { Router } from "express";
import {
  getReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  getDashboardStats,
} from "../controllers/reservationsController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// Todas requieren autenticación
router.use(protect);

// Estadísticas para el Dashboard (requiere ver)
router.get(
  "/stats/dashboard",
  authorize("reservations:view"),
  getDashboardStats
);

// CRUD principal
router.get("/", authorize("reservations:view"), getReservations);
router.post("/", authorize("reservations:manage"), createReservation);
router.put("/:id", authorize("reservations:manage"), updateReservation);
router.delete("/:id", authorize("reservations:manage"), deleteReservation);

export default router;
