import "../models/index.js";
import express from "express";
import { verificarToken } from "../middlewares/authMiddleware.js";
import {
  obtenerTodosLosLogros,
  obtenerLogrosUsuario,
  verificarProgreso
} from "../controllers/logroController.js";

const router = express.Router();

// Obtener todos los logros disponibles
router.get('/', verificarToken, obtenerTodosLosLogros);

// Obtener logros de un usuario específico
router.get('/usuario/:usuarioId', verificarToken, obtenerLogrosUsuario);

// Verificar y actualizar progreso de logros de un usuario
router.post('/verificar/:usuarioId', verificarToken, verificarProgreso);

export default router;