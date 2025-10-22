import Vehiculo from "../models/Vehiculo.js";
import Usuario from "../models/Usuario.js";
import Reserva from "../models/Reserva.js";

// Función para registrar una nueva reserva
export const registrar = async (req, res) => {
  try {
    const { motivo, fechaInicio, fechaFin, UsuarioId, VehiculoId, horaInicio, horaFin, descripcion } = req.body;

    // Validar que el usuario y vehículo existen
    const usuario = await Usuario.findByPk(UsuarioId);
    const vehiculo = await Vehiculo.findByPk(VehiculoId);

    if (!usuario || !vehiculo) {
      return res.status(404).json({ error: "Usuario o Vehículo no encontrado." });
    }

    // Crear la reserva
    const reserva = await Reserva.create({
      motivo,
      fechaInicio,
      fechaFin,
      UsuarioId,
      VehiculoId,
      horaInicio,
      horaFin,
      descripcion,
    });

    res.status(201).json(reserva);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Listar todas las reservas de un usuario y un vehículo
export const listar = async (req, res) => {
  try {
    const reservas = await Reserva.findAll({
      include: [Usuario, Vehiculo],
    });
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar una reserva
export const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, fechaInicio, fechaFin, UsuarioId, VehiculoId, horaInicio, horaFin, descripcion } = req.body;

    const reserva = await Reserva.findByPk(id);
    if (!reserva) {
      return res.status(404).json({ error: "Reserva no encontrada." });
    }

    // Actualizar campos
    reserva.motivo = motivo ?? reserva.motivo;
    reserva.fechaInicio = fechaInicio ?? reserva.fechaInicio;
    reserva.fechaFin = fechaFin ?? reserva.fechaFin;
    reserva.UsuarioId = UsuarioId ?? reserva.UsuarioId;
    reserva.VehiculoId = VehiculoId ?? reserva.VehiculoId;
    reserva.horaInicio = horaInicio ?? reserva.horaInicio;
    reserva.horaFin = horaFin ?? reserva.horaFin;
    reserva.descripcion = descripcion ?? reserva.descripcion;

    await reserva.save();
    res.json(reserva);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar una reserva
export const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const reserva = await Reserva.findByPk(id);
    if (!reserva) {
      return res.status(404).json({ error: "Reserva no encontrada." });
    }
    await reserva.destroy();
    res.json({ mensaje: "Reserva eliminada correctamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};