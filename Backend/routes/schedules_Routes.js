import { Router } from "express";
import {
  getDashboardSchedules,
  getSchedules,
  createSchedule,
  deleteSchedule,
} from "../controllers/schedulesController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

router.get("/dashboard", authorize("schedules:view"), getDashboardSchedules);
router.get("/", authorize("schedules:view"), getSchedules);
router.post("/", authorize("schedules:manage"), createSchedule);
router.delete("/:id", authorize("schedules:manage"), deleteSchedule);

export default router;
