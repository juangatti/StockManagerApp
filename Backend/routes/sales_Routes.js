import { Router } from "express";
import multer from "multer";
import { processSalesFile } from "../controllers/salesController.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/salesProcessor",
  upload.single("archivoVentas"),
  processSalesFile
);

export default router;
