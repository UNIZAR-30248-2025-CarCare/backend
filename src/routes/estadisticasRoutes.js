import "../models/index.js";
import express from "express";
import { getEstadisticas } from "../controllers/estadisticasController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/:vehiculoId", verificarToken, getEstadisticas);
export default router;