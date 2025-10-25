import Vehiculo from "../models/Vehiculo.js";
import Usuario from "../models/Usuario.js";
import Reserva from "../models/Reserva.js";

// Función para registrar una nueva reserva
export const registrar = async (req, res) => {
  try {
    const { tipo, fechaInicio, fechaFinal, vehiculoId, horaInicio, horaFin, notas } = req.body;
    
    // Obtener el userId del token (viene del middleware)
    const UsuarioId = req.usuario.id;
    const VehiculoId = vehiculoId;

    // Validar que el usuario y vehículo existen
    const usuario = await Usuario.findByPk(UsuarioId);
    const vehiculo = await Vehiculo.findByPk(VehiculoId);

    if (!usuario || !vehiculo) {
      return res.status(404).json({ error: "Usuario o Vehículo no encontrado." });
    }

    // Crear la reserva
    const reserva = await Reserva.create({
      motivo: tipo, // El frontend envía "tipo" (TRABAJO/PERSONAL)
      fechaInicio,
      fechaFin: fechaFinal, // El frontend envía "fechaFinal"
      UsuarioId,
      VehiculoId,
      horaInicio,
      horaFin,
      descripcion: notas, // El frontend envía "notas"
    });

    res.status(201).json(reserva);
  } catch (error) {
    console.error("Error al crear reserva:", error);
    res.status(400).json({ error: error.message });
  }
};

// Listar todas las reservas de un usuario
export const listar = async (req, res) => {
  try {
    // Obtener el userId del token
    const UsuarioId = req.usuario.id;
    
    const reservas = await Reserva.findAll({
      where: { UsuarioId },
      include: [
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: Vehiculo,
          attributes: ['id', 'nombre', 'matricula', 'tipo']
        }
      ],
      order: [['fechaInicio', 'DESC']]
    });
    
    res.json({ reservas });
  } catch (error) {
    console.error("Error al listar reservas:", error);
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