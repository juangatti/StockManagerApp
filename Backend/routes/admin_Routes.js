import { Router } from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getIngredients,
  createIngredient,
  createStockItem,
  createRecipe,
  getProducts,
} from "../controllers/adminController.js";

const router = Router();

router.use(protect, authorize("admin"));
router.get("/ingredients", getIngredients);
router.post("/ingredients", createIngredient);

router.post("/stock-items", createStockItem);

router.post("/recipes", createRecipe);

router.get("/products", getProducts);

export default router;
