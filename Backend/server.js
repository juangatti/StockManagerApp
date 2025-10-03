import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import stockRoutes from "./routes/stock_Routes.js";
import prebatchRoutes from "./routes/prebatch_Routes.js";

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas de la API
app.use("/api/stock", stockRoutes);
app.use("/api/prebatches", prebatchRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
