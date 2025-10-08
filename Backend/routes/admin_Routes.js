import { Router } from "express";
import {
  getIngredients,
  createIngredient,
  createStockItem,
} from "../controllers/adminController.js";

const router = Router();

router.get("/ingredients", getIngredients);
router.post("/ingredients", createIngredient);

router.post("/stock-items", createStockItem);

export default router;
