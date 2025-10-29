import "../models/index.js";
import express from "express";
import { crearRepostaje, obtenerRepostajesVehiculo, calcularProximoRepostaje } from "../controllers/repostajeController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";


const router = express.Router();

router.post('/crearRepostaje', verificarToken, crearRepostaje);
router.get('/obtenerRepostajesVehiculo/:vehiculoId', verificarToken, obtenerRepostajesVehiculo);
router.get('/calcularProximoRepostaje/:vehiculoId', verificarToken, calcularProximoRepostaje);


export default router;