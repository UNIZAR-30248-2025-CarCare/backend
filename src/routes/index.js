import express from "express";
import usuarioRoutes from "./usuarioRoutes.js";
import vehiculoRoutes from "./vehiculoRoutes.js";

const router = express.Router();

router.use("/usuario", usuarioRoutes);
router.use("/vehiculo", vehiculoRoutes);

export default router;
