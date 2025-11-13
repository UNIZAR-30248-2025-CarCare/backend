import { Router } from "express";
import busquedaController from "../controllers/busquedaController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/global/:vehiculoId", verificarToken, busquedaController.busquedaGlobal);
export default router;