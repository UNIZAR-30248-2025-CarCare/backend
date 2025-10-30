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

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    
    if (!vehiculo) {
      return res.status(404).json({ error: "Vehículo no encontrado." });
    }

    // Validar que el vehículo está disponible
    if (vehiculo.disponible === false) {
      return res.status(400).json({ error: "El vehículo no está disponible para reservas." });
    }

    // Validar que el usuario tiene acceso al vehículo
    const tieneAcceso = await vehiculo.hasUsuario(UsuarioId);
    if (!tieneAcceso) {
      return res.status(403).json({ error: "No tienes permisos para reservar este vehículo." });
    }

    // Crear la reserva (las validaciones del modelo se ejecutan automáticamente)
    const reserva = await Reserva.create({
      motivo: tipo,
      fechaInicio,
      fechaFin: fechaFinal,
      UsuarioId,
      VehiculoId,
      horaInicio,
      horaFin,
      descripcion: notas,
    });

    res.status(201).json({
      mensaje: "Reserva creada exitosamente",
      reserva
    });
  } catch (error) {
    console.error("Error al crear reserva:", error);
    
    // Devolver errores de validación del modelo de forma clara
    res.status(400).json({ 
      error: error.message || "Error al crear la reserva"
    });
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

    // Verificar que la reserva pertenece al usuario
    if (reserva.UsuarioId !== req.usuario.id) {
      return res.status(403).json({ error: "No tienes permisos para modificar esta reserva." });
    }

    // Actualizar campos
    reserva.motivo = motivo ?? reserva.motivo;
    reserva.fechaInicio = fechaInicio ?? reserva.fechaInicio;
    reserva.fechaFin = fechaFin ?? reserva.fechaFin;
    reserva.VehiculoId = VehiculoId ?? reserva.VehiculoId;
    reserva.horaInicio = horaInicio ?? reserva.horaInicio;
    reserva.horaFin = horaFin ?? reserva.horaFin;
    reserva.descripcion = descripcion ?? reserva.descripcion;

    // save() ejecutará los hooks de validación (beforeUpdate)
    await reserva.save();
    
    res.json({
      mensaje: "Reserva actualizada exitosamente",
      reserva
    });
  } catch (error) {
    console.error("Error al actualizar reserva:", error);
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

    // Verificar que la reserva pertenece al usuario
    if (reserva.UsuarioId !== req.usuario.id) {
      return res.status(403).json({ error: "No tienes permisos para eliminar esta reserva." });
    }

    await reserva.destroy();
    res.json({ mensaje: "Reserva eliminada correctamente." });
  } catch (error) {
    console.error("Error al eliminar reserva:", error);
    res.status(500).json({ error: error.message });
  }
};