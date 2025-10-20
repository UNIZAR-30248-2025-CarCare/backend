import "../models/usuario_vehiculo.js";
import express from "express";
import { registrar,generarInvitacion } from "../controllers/vehiculoController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/registrar', registrar);
router.post('/:vehiculoId/invitaciones', generarInvitacion);

export default router;