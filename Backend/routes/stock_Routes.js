import { Router } from "express";
import {
  getStock,
  getStockTotals,
  registerPurchase,
  registerAdjustment,
  registerMassiveAdjustment,
  getStockMovements,
  getIceReport,
} from "../controllers/stockController.js";

const router = Router();

router.get("/", getStock);
router.get("/totals", getStockTotals);
router.post("/purchases", registerPurchase);
router.post("/adjust", registerAdjustment);
router.post("/MassAdjustment", registerMassiveAdjustment);
router.get("/historicMovement", getStockMovements);
router.get("/ice", getIceReport);

export default router;
