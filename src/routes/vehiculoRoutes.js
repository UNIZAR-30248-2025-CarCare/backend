import "../models/usuario_vehiculo.js";
import express from "express";
import { registrar } from "../controllers/vehiculoController.js";

const router = express.Router();

router.post('/registrar', registrar);


export default router;