import { Router } from "express";
import {
  getStock,
  getStockTotals,
  registerPurchase,
  registerAdjustment,
  registerMassiveAdjustment,
  getStockMovements,
  getMovementEventById,
  searchStockItems,
  getIceReport,
  getStockAlerts,
} from "../controllers/stockController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

router.get("/", getStock);
router.get("/totals", getStockTotals);
router.get("/search-items", searchStockItems);
router.get("/ice", getIceReport);
router.get("/alerts", getStockAlerts);

router.post("/purchases", authorize("admin"), registerPurchase);
router.post("/adjust", authorize("admin"), registerAdjustment);
router.post("/mass-adjustment", authorize("admin"), registerMassiveAdjustment);
router.get("/historic-movement", authorize("admin"), getStockMovements);
router.get("/historic-movement/:id", authorize("admin"), getMovementEventById);

export default router;
