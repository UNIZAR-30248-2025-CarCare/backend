import "../models/index.js";
import express from "express";
import { sign_in, sign_up, obtenerNombreUsuario, actualizarFotoPerfil} from "../controllers/usuarioController.js";
import { verificarToken } from '../middlewares/authMiddleware.js';
import uploadProfilePhoto from "../config/multerConfig.js";

const router = express.Router();

// Rutas públicas
router.post('/sign-up', sign_up);
router.post('/sign-in', sign_in);

// Rutas protegidas
router.get('/obtenerNombreUsuario/:id', verificarToken, obtenerNombreUsuario);

// 💡 RUTA NUEVA: Subir/Actualizar foto de perfil
// Usa 1. verificarToken para asegurar el usuario, y 2. uploadProfilePhoto para manejar el archivo
router.put('/perfil/foto', verificarToken, uploadProfilePhoto, actualizarFotoPerfil);

export default router;