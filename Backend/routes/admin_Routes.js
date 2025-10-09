import { Router } from "express";
import {
  getCategories,
  createCategory,
  getMarcas,
  createMarca,
  getProducts,
  createStockItem,
  createRecipe,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// Todas las rutas de admin están protegidas y solo para el rol 'admin'
router.use(protect, authorize("admin"));

// Rutas para Categorías
router.get("/categories", getCategories);
router.post("/categories", createCategory);

// Rutas para Marcas
router.get("/marcas", getMarcas);
router.post("/marcas", createMarca);

// Rutas para Productos (Tragos)
router.get("/products", getProducts);

// Ruta para Items de Stock
router.post("/stock-items", createStockItem);

// Ruta para Recetas
router.post("/recipes", createRecipe);

export default router;
