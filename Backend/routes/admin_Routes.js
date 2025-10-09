import { Router } from "express";
import {
  getCategories,
  createCategory,
  getMarcas,
  createMarca,
  getProducts,
  createStockItem,
  createRecipe,
  getCategoryById,
  updateCategory,
  getMarcaById,
  updateMarca,
  getStockItemById,
  updateStockItem,
  getRecipeById,
  updateRecipe,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// Todas las rutas de admin están protegidas y solo para el rol 'admin'
router.use(protect, authorize("admin"));

// Rutas para Categorías
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.get("/categories/:id", getCategoryById);
router.put("/categories/:id", updateCategory);

// Rutas para Marcas
router.get("/marcas", getMarcas);
router.post("/marcas", createMarca);
router.get("/marcas/:id", getMarcaById);
router.put("/marcas/:id", updateMarca);

// Rutas para Productos (Tragos)
router.get("/products", getProducts);

// Ruta para Items de Stock
router.post("/stock-items", createStockItem);
router.get("/stock-items/:id", getStockItemById);
router.put("/stock-items/:id", updateStockItem);

// Ruta para Recetas
router.post("/recipes", createRecipe);
router.get("/recipes/:id", getRecipeById);
router.put("/recipes/:id", updateRecipe);

export default router;
