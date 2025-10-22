import "../models/index.js";
import express from "express";
import { sign_in, sign_up, obtenerNombreUsuario } from "../controllers/usuarioController.js";
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas públicas
router.post('/sign-up', sign_up);
router.post('/sign-in', sign_in);

// Rutas protegidas
router.get('/obtenerNombreUsuario/:id', verificarToken, obtenerNombreUsuario);

export default router;