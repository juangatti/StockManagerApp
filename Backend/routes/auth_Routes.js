import { Router } from "express";
import { loginUser, updatePassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", loginUser);

router.put("/profile/password", protect, updatePassword);

export default router;
