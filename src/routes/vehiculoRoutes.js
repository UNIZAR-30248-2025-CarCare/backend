import "../models/index.js";
import express from "express";
import { registrar,generarInvitacion,aceptarInvitacion } from "../controllers/vehiculoController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/registrar', verificarToken, registrar);
router.post('/:vehiculoId/invitaciones', verificarToken, generarInvitacion);
router.post('/unirse', verificarToken, aceptarInvitacion);

export default router;