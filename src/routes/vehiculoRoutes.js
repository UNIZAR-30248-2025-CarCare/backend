import express from "express";
import { Vehiculo } from "../models/Vehiculo.js";
import { Usuario } from "../models/Usuario.js";

const router = express.Router();

// Crear vehículo
router.post("/", async (req, res) => {
  try {
    const vehiculo = await Vehiculo.create(req.body);
    res.json(vehiculo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener vehículos con sus usuarios
router.get("/", async (req, res) => {
  const vehiculos = await Vehiculo.findAll({ include: Usuario });
  res.json(vehiculos);
});

export default router;
