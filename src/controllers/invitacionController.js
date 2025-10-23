import Vehiculo from "../models/Vehiculo.js";
import Invitacion from "../models/Invitacion.js";
import { Usuario } from "../models/index.js";

// Función para generar una invitación para un vehículo
export const generarInvitacion = async (req, res) => {
  try {
    const { vehiculoId } = req.params;
    const { usuarioId } = req.body; // Obtener el ID del usuario desde el token verificado
    const { emailInvitado } = req.body;      // del body JSON enviado por el frontend

    const vehiculo = await Vehiculo.findByPk(vehiculoId);
    if (!vehiculo) return res.status(404).json({ error: "Vehículo no encontrado." });

    // Verificar si el usuario es propietario
    // Esto hay que revisarlo, no es así exactamente
    //const esPropietario = await vehiculo.hasUsuario(usuarioId);
    //if (!esPropietario) return res.status(403).json({ error: "No tienes permisos sobre este vehículo." });

    // Buscar al usuario invitado por su email
    const invitado = await Usuario.findOne({ where: { email: emailInvitado } });
    if (!invitado) return res.status(404).json({ error: "Usuario invitado no encontrado." });

    // No permitir invitarse a sí mismo
    if (usuarioId === invitado.id) {
      return res.status(400).json({ error: "No puedes invitarte a ti mismo." });
    }

    // No permitir crear otra invitación activa con el mismo creador, invitado y vehículo
    const invitacionExistente = await Invitacion.findOne({
      where: {
        vehiculoId,
        creadoPorId: usuarioId,
        usuarioInvitadoId: invitado.id
      }
    });
    if (invitacionExistente) {
      return res.status(409).json({ error: "Ya existe una invitación activa para este usuario y vehículo." });
    }

    // El código será usado en versiones posteriores
    const codigo = "JOIN-" + Math.random().toString(36).substr(2, 8).toUpperCase();

    const nuevaInvitacion = await Invitacion.create({
      vehiculoId,
      creadoPorId: usuarioId,
      usuarioInvitadoId: invitado.id,
      codigo,
      usado: false
    });

    //Devolver la respuesta al frontend
    res.status(200).json({
      message: "Invitación generada exitosamente",
      codigo,
      vehiculo: {
        id: vehiculo.id,
        nombre: vehiculo.nombre,
        matricula: vehiculo.matricula
      } 
    });

  } catch (error) {
    res.status(500).json({ error: "Error al generar la invitación.", detalles: error.message });
  }
};

// Función para aceptar una invitación
export const aceptarInvitacion = async (req, res) => {
  try {
    //const usuarioId = req.usuario.id; // Obtener el ID del usuario desde el token verificado
    const { codigo } = req.body;

    const invitacion = await Invitacion.findOne({ where: { codigo } });
    if (!invitacion) return res.status(404).json({ error: "Invitación no encontrada." });
    if (invitacion.usado) return res.status(400).json({ error: "La invitación ya ha sido utilizada." });

    /*if (invitacion.usuarioInvitadoId !== usuarioId) {
      return res.status(403).json({ error: "No tienes permiso para aceptar esta invitación." });
    }*/

    // Obtener el vehículo asociado a la invitación
    const vehiculo = await Vehiculo.findByPk(invitacion.vehiculoId);
    if (!vehiculo) return res.status(404).json({ error: "Vehículo no encontrado." });

    // Asociar el usuario invitado al vehículo
    await vehiculo.addUsuario(invitacion.usuarioInvitadoId);

    // Marcar la invitación como usada
    invitacion.usado = true;
    await invitacion.save();

    // Devolver la respuesta
    res.status(200).json({
      message: "Invitación aceptada correctamente. Ahora eres copropietario del vehículo.",
      vehiculo: {
        id: vehiculo.id,
        nombre: vehiculo.nombre,
        matricula: vehiculo.matricula
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Error al aceptar la invitación.", detalles: error.message });
  }
};

// Función para rechazar una invitación
export const rechazarInvitacion = async (req, res) => {
  try {
    const { invitacionId } = req.body;
    const { usuarioId } = req.body; // O usa req.body.usuarioId si no usas token

    // Buscar la invitación
    const invitacion = await Invitacion.findByPk(invitacionId);
    if (!invitacion) {
      return res.status(404).json({ error: "Invitación no encontrada." });
    }

    // Comprobar que la invitación corresponde al usuario autenticado
    if (invitacion.usuarioInvitadoId !== usuarioId) {
      return res.status(403).json({ error: "No tienes permiso para rechazar esta invitación." });
    }

    // Eliminar la invitación
    //await invitacion.destroy();

    // Marcar la invitación como usada, pero sin crear la relación
    invitacion.usado = true;
    await invitacion.save();

    res.status(200).json({ message: "Invitación rechazada y eliminada correctamente." });
  } catch (error) {
    res.status(500).json({ error: "Error al rechazar la invitación.", detalles: error.message });
  }
};

export const obtenerInvitacionesRecibidas = async (req, res) => {
  try {
    const usuarioId = req.params.usuarioId;

    // Comprobar si el usuario existe
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // Buscar invitaciones recibidas
    const invitaciones = await Invitacion.findAll({
      where: { 
        usuarioInvitadoId: usuarioId,
        usado: false 
    },
      include: [
        {
          model: Vehiculo,
          attributes: ["id", "nombre", "matricula"]
        }
      ]
    });

    res.status(200).json({ invitaciones });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las invitaciones.", detalles: error.message });
  }
};