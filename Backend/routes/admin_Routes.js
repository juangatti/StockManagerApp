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
  getAllActiveCategories,
  getInactiveCategories,
  restoreCategory,
  getInactiveMarcas,
  getAllActiveMarcas,
  restoreMarca,
  getInactiveProducts,
  restoreProduct,
  getActiveStockItems,
  getInactiveStockItem,
  restoreStockItem,
  getAllActiveStockItemsForAdjustment,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// Todas las rutas de admin están protegidas y solo para el rol 'admin'
router.use(protect, authorize("admin"));

// Rutas para Categorías
router.get("/categories", getCategories);
router.get("/categories/inactive", getInactiveCategories);
router.get("/categories/all", getAllActiveCategories);
router.post("/categories", createCategory);
router.get("/categories/:id", getCategoryById);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);
router.put("/categories/:id/restore", restoreCategory);

// Rutas para Marcas
router.get("/marcas", getMarcas);
router.get("/marcas/inactive", getInactiveMarcas);
router.get("/marcas/all", getAllActiveMarcas);
router.get("/marcas/:id", getMarcaById);
router.post("/marcas", createMarca);
router.put("/marcas/:id", updateMarca);
router.delete("/marcas/:id", deleteMarca);
router.put("/marcas/:id/restore", restoreMarca);

// Rutas para Productos (Tragos)
router.get("/products", getProducts);
router.get("/products/inactive", getInactiveProducts);
router.delete("/products/:id", deleteProduct);
router.put("/products/:id/restore", restoreProduct);

// Ruta para Items de Stock
router.get(
  "/stock-items/all-for-adjustment",
  getAllActiveStockItemsForAdjustment
);
router.get("/stock-items", getActiveStockItems);
router.get("/stock-items/:id", getStockItemById);
router.get("/stock-items/inactive", getInactiveStockItem);
router.post("/stock-items", createStockItem);
router.put("/stock-items/:id", updateStockItem);
router.delete("/stock-items/:id", deleteStockItem);
router.put("/stock-items/:id/restore", restoreStockItem);

// Ruta para Recetas
router.post("/recipes", createRecipe);
router.get("/recipes/:id", getRecipeById);
router.put("/recipes/:id", updateRecipe);

export default router;
