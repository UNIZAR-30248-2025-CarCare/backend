import "../models/usuario_vehiculo.js";
import express from "express";
import { sign_in, sign_up } from "../controllers/usuarioController.js";

const router = express.Router();

router.post('/sign-up', sign_up);
router.post('/sign-in', sign_in);


export default router;