// Backend/routes/prebatch_Routes.js
import { Router } from "express";
import {
  getAllPrebatches,
  getPrebatchTotals,
  createPrebatch,
  updatePrebatch,
  deletePrebatch,
  getPrebatchNames,
} from "../controllers/prebatchController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// La vista de totales puede ser para todos los usuarios logueados
router.get("/totals", protect, getPrebatchTotals);
router.get("/names", protect, getPrebatchNames);
router.get("/", protect, getAllPrebatches);

// El resto de operaciones (ver lista, crear, editar, borrar) son solo para admin
router.route("/").post(protect, authorize("admin"), createPrebatch);

router
  .route("/:id")
  .put(protect, authorize("admin"), updatePrebatch)
  .delete(protect, authorize("admin"), deletePrebatch);

export default router;
