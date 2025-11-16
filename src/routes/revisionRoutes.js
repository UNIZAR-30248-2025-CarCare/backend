import "../models/index.js";
import express from "express";
import { registrarRevision , obtenerRevisiones  } from "../controllers/revisionController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";


const router = express.Router();

router.post('/registrar', verificarToken, registrarRevision);
router.get('/obtenerRevisiones/:vehiculoId', verificarToken, obtenerRevisiones);

export default router;