import express from "express";
import usuarioRoutes from "./usuarioRoutes.js";
import vehiculoRoutes from "./vehiculoRoutes.js";
import invitacionRoutes from "./invitacionRoutes.js";
import revisionRoutes from "./revisionRoutes.js";

const router = express.Router();

router.use("/usuario", usuarioRoutes);
router.use("/vehiculo", vehiculoRoutes);
router.use("/invitacion", invitacionRoutes);
router.use("/revision", revisionRoutes);


export default router;
