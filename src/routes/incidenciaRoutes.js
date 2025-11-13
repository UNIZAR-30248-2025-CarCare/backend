import "../models/index.js";
import express from "express";
import { verificarToken } from "../middlewares/authMiddleware.js";
import { 
  crearIncidencia,
  obtenerIncidenciasVehiculo,
  obtenerIncidenciasUsuario,
  obtenerIncidencia,
  actualizarEstadoIncidencia,
  actualizarIncidencia,
  eliminarIncidencia
} from "../controllers/incidenciaController.js";

const router = express.Router();

// Crear nueva incidencia
router.post('/crear', verificarToken, crearIncidencia);

// Obtener todas las incidencias de un vehículo específico
router.get('/vehiculo/:vehiculoId', verificarToken, obtenerIncidenciasVehiculo);

// Obtener todas las incidencias de los vehículos del usuario
router.get('/usuario', verificarToken, obtenerIncidenciasUsuario);

// Obtener una incidencia específica
router.get('/:incidenciaId', verificarToken, obtenerIncidencia);

// Actualizar solo el estado de una incidencia
router.patch('/:incidenciaId/estado', verificarToken, actualizarEstadoIncidencia);

// Actualizar una incidencia completa
router.put('/:incidenciaId', verificarToken, actualizarIncidencia);

// Eliminar una incidencia
router.delete('/:incidenciaId', verificarToken, eliminarIncidencia);

export default router;