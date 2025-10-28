import "../models/index.js";
import express from "express";
import { crearViaje, obtenerViajes } from "../controllers/viajeController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";


const router = express.Router();

router.post('/crearViaje', verificarToken, crearViaje);
router.get('/obtenerViajes/:vehiculoId', verificarToken, obtenerViajes);

export default router;