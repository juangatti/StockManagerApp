import { Router } from "express";
import {
  getDashboardSchedules,
  getSchedules,
  createSchedule,
  deleteSchedule,
  getWorkers,
  createWorker,
  getBarConfig,
  updateBarConfig,
} from "../controllers/schedulesController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

// Dashboard data
router.get("/dashboard", authorize("schedules:view"), getDashboardSchedules);

// Schedules
router.get("/", authorize("schedules:view"), getSchedules);
router.post("/", authorize("schedules:manage"), createSchedule);
router.delete("/:id", authorize("schedules:manage"), deleteSchedule);

// Workers
router.get("/workers", authorize("schedules:view"), getWorkers);
router.post("/workers", authorize("schedules:manage"), createWorker);

// Bar Config
router.get("/bar-config", authorize("schedules:view"), getBarConfig);
router.post("/bar-config", authorize("schedules:manage"), updateBarConfig);

export default router;
