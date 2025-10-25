import { Router } from "express";
import { registrar, listar, actualizar, eliminar } from "../controllers/reservaController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = Router();

// Registrar una nueva reserva
router.post("/", verificarToken, registrar);

// Listar todas las reservas
router.get("/", verificarToken, listar);

// Actualizar una reserva por ID
router.put("/:id", verificarToken, actualizar);

// Eliminar una reserva por ID
router.delete("/:id", verificarToken, eliminar);

export default router;