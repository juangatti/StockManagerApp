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
  createUser,
  getUsers,
  getInactiveUsers,
  getUserById,
  updateUser,
  deleteUser,
  restoreUser,
  seedPermissions,
  getPermissions,
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// Todas las rutas de admin están protegidas y solo para el rol 'admin'
router.use(protect);

// --- Rutas de Permisos y Roles (Solo para 'roles:manage') ---
router.post("/seed-permissions", authorize("roles:manage"), seedPermissions); // Ruta especial
router.get("/permissions", authorize("roles:manage"), getPermissions);
router.get("/roles", authorize("roles:manage"), getRoles);
router.post("/roles", authorize("roles:manage"), createRole);
router.get("/roles/:id", authorize("roles:manage"), getRoleById);
router.put("/roles/:id", authorize("roles:manage"), updateRole);
router.delete("/roles/:id", authorize("roles:manage"), deleteRole);

// --- Rutas de Gestión de Usuarios (Solo para 'users:manage') ---
router.post("/users", authorize("users:manage"), createUser);
router.get("/users", authorize("users:manage"), getUsers);
router.get("/users/inactive", authorize("users:manage"), getInactiveUsers);
router.get("/users/:id", authorize("users:manage"), getUserById);
router.put("/users/:id", authorize("users:manage"), updateUser);
router.delete("/users/:id", authorize("users:manage"), deleteUser);
router.put("/users/:id/restore", authorize("users:manage"), restoreUser);

// --- Rutas de Catálogo (Solo para 'catalog:manage') ---
router.get("/categories", authorize("catalog:manage"), getCategories);
router.get(
  "/categories/inactive",
  authorize("catalog:manage"),
  getInactiveCategories
);
router.post("/categories", authorize("catalog:manage"), createCategory);
router.get("/categories/:id", authorize("catalog:manage"), getCategoryById);
router.put("/categories/:id", authorize("catalog:manage"), updateCategory);
router.delete("/categories/:id", authorize("catalog:manage"), deleteCategory);
router.put(
  "/categories/:id/restore",
  authorize("catalog:manage"),
  restoreCategory
);
// (Ruta 'all' debe ser accesible para otros permisos, ej. 'production:create')
router.get("/categories/all", getAllActiveCategories); // <-- Dejar esta sin 'authorize'

router.get("/marcas", authorize("catalog:manage"), getMarcas);
router.get("/marcas/inactive", authorize("catalog:manage"), getInactiveMarcas);
router.get("/marcas/:id", authorize("catalog:manage"), getMarcaById);
router.post("/marcas", authorize("catalog:manage"), createMarca);
router.put("/marcas/:id", authorize("catalog:manage"), updateMarca);
router.delete("/marcas/:id", authorize("catalog:manage"), deleteMarca);
router.put("/marcas/:id/restore", authorize("catalog:manage"), restoreMarca);
// (Ruta 'all' debe ser accesible para otros permisos)
router.get("/marcas/all", getAllActiveMarcas); // <-- Dejar esta sin 'authorize'

router.get("/products", authorize("catalog:manage"), getProducts);
router.get(
  "/products/inactive",
  authorize("catalog:manage"),
  getInactiveProducts
);
router.delete("/products/:id", authorize("catalog:manage"), deleteProduct);
router.put(
  "/products/:id/restore",
  authorize("catalog:manage"),
  restoreProduct
);

router.get("/stock-items", authorize("catalog:manage"), getActiveStockItems);
router.get("/stock-items/:id", authorize("catalog:manage"), getStockItemById);
router.get(
  "/stock-items/inactive",
  authorize("catalog:manage"),
  getInactiveStockItem
);
router.post("/stock-items", authorize("catalog:manage"), createStockItem);
router.put("/stock-items/:id", authorize("catalog:manage"), updateStockItem);
router.delete("/stock-items/:id", authorize("catalog:manage"), deleteStockItem);
router.put(
  "/stock-items/:id/restore",
  authorize("catalog:manage"),
  restoreStockItem
);
// (Ruta 'all-for-adjustment' debe ser accesible para 'stock:adjust')
router.get(
  "/stock-items/all-for-adjustment",
  authorize("stock:adjust"), // <-- Proteger con su permiso específico
  getAllActiveStockItemsForAdjustment
);

router.post("/recipes", authorize("catalog:manage"), createRecipe);
router.get("/recipes/:id", authorize("catalog:manage"), getRecipeById);
router.put("/recipes/:id", authorize("catalog:manage"), updateRecipe);

export default router;
