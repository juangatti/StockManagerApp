import { Router } from "express";
import {
  getPrebatches,
  getPrebatchTotals,
} from "../controllers/stockController.js";

const router = Router();

router.get("/", getPrebatches);
router.get("/totals", getPrebatchTotals);

export default router;
