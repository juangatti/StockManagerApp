import { Router } from "express";
import {
  getStock,
  getStockTotals,
  registerPurchase,
  registerAdjustment,
} from "../controllers/stockController.js";

const router = Router();

router.get("/stock", getStock);
router.get("/stock/totales", getStockTotals);
router.post("/stock/compras", registerPurchase);
router.post("/stock/ajuste", registerAdjustment);

export default router;
