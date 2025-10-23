import "../models/index.js";
import express from "express";
import { generarInvitacion, aceptarInvitacion, rechazarInvitacion, obtenerInvitacionesRecibidas } from "../controllers/invitacionController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";


const router = express.Router();

router.post('/generarInvitacion/:vehiculoId', verificarToken, generarInvitacion);
router.post('/aceptarInvitacion', verificarToken, aceptarInvitacion);
router.post('/rechazarInvitacion', verificarToken, rechazarInvitacion);
router.get('/invitacionesRecibidas/:usuarioId', verificarToken, obtenerInvitacionesRecibidas);


export default router;