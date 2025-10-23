import "../models/index.js";
import express from "express";
import { verificarToken } from "../middlewares/authMiddleware.js";
import { obtenerVehiculosUsuario, obtenerUbicacionVehiculo, actualizarUbicacionVehiculo, registrarVehiculo } from "../controllers/vehiculoController.js";

const router = express.Router();

router.post('/registrar', verificarToken, registrarVehiculo);
router.get('/obtenerVehiculos/:usuarioId', verificarToken, obtenerVehiculosUsuario);
router.get('/obtenerUbicacion/:vehiculoId', verificarToken, obtenerUbicacionVehiculo);
router.put('/actualizarUbicacion/:vehiculoId', verificarToken, actualizarUbicacionVehiculo);

export default router;