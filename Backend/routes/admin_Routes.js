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
  deleteCategory,
  deleteMarca,
  deleteStockItem,
  deleteProduct,
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
router.delete("/categories/:id", deleteCategory);

// Rutas para Marcas
router.get("/marcas", getMarcas);
router.post("/marcas", createMarca);
router.get("/marcas/:id", getMarcaById);
router.put("/marcas/:id", updateMarca);
router.delete("/marcas/:id", deleteMarca);
// Rutas para Productos (Tragos)
router.get("/products", getProducts);

// Ruta para Items de Stock
router.post("/stock-items", createStockItem);
router.get("/stock-items/:id", getStockItemById);
router.put("/stock-items/:id", updateStockItem);
router.delete("/stock-items/:id", deleteStockItem);
// Ruta para Recetas
router.post("/recipes", createRecipe);
router.get("/recipes/:id", getRecipeById);
router.put("/recipes/:id", updateRecipe);
router.delete("/products/:id", deleteProduct);

export default router;
