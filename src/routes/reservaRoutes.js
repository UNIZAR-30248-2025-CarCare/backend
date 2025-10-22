import { Router } from "express";
import { registrar, listar, actualizar, eliminar } from "../controllers/reservaController.js";

const router = Router();

// Registrar una nueva reserva
router.post("/", registrar);

// Listar todas las reservas
router.get("/", listar);

// Actualizar una reserva por ID
router.put("/:id", actualizar);

// Eliminar una reserva por ID
router.delete("/:id", eliminar);

export default router;