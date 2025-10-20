import Vehiculo from "../models/Vehiculo.js";
import Invitacion from "../models/Invitacion.js";
import { Usuario } from "../models/usuario_vehiculo.js";

// Función para registrar un nuevo vehículo
export const registrar = async (req, res) => {
  try {
    const {
      usuarioId,
      nombre,
      matricula,
      modelo,
      fabricante,
      antiguedad,
      tipo_combustible,
      litros_combustible,
      consumo_medio,
      ubicacion_actual,
      estado,
    } = req.body;

    // Validar que los campos obligatorios estén presentes
    if (!usuarioId || !nombre || !matricula || !modelo || !fabricante || !antiguedad || !tipo_combustible || !consumo_medio) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    // Buscar al usuario que registra el vehículo
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // Crear el nuevo vehículo
    const nuevoVehiculo = await Vehiculo.create({
      nombre,
      matricula,
      modelo,
      fabricante,
      antiguedad,
      tipo_combustible,
      litros_combustible,
      consumo_medio,
      ubicacion_actual,
      estado,
    });

    await usuario.addVehiculo(nuevoVehiculo);

    res.status(200).json({ message: "Vehículo registrado exitosamente.", vehiculo: nuevoVehiculo });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar el vehículo.", detalles: error.message });
  }
};

// Función para generar una invitación para un vehículo
export const generarInvitacion = async (req, res) => {
  try {
    const { vehiculoId } = req.params;
    //const usuarioId = req.usuario.id; // Obtener el ID del usuario desde el token verificado
    const { emailInvitado } = req.body;      // del body JSON enviado por el frontend

    const vehiculo = await Vehiculo.findByPk(vehiculoId);
    if (!vehiculo) return res.status(404).json({ error: "Vehículo no encontrado." });

    /*// Verificar si el usuario es propietario
    const esPropietario = await vehiculo.hasUsuario(usuarioId);
    if (!esPropietario) return res.status(403).json({ error: "No tienes permisos sobre este vehículo." });*/

    // Buscar al usuario invitado por su email
    const invitado = await Usuario.findOne({ where: { email: emailInvitado } });
    if (!invitado) return res.status(404).json({ error: "Usuario invitado no encontrado." });

    const codigo = "JOIN-" + Math.random().toString(36).substr(2, 8).toUpperCase();

    const nuevaInvitacion = await Invitacion.create({
      vehiculoId,
      creadoPorId: 2, //usuarioId,
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

/*export const asociarUsuarioVehiculo = async (req, res) => {
  try {
    const vehiculoId = req.params.id;
    const { email, nombre } = req.body;

    if (!email || !nombre) {
      return res.status(400).json({ error: "Faltan datos obligatorios (email y nombre)." });
    }

    // Buscar o crear el usuario
    let [usuario] = await Usuario.findOrCreate({
      where: { email },
      defaults: { nombre }
    });

    // Buscar el vehículo
    const vehiculo = await Vehiculo.findByPk(vehiculoId);
    if (!vehiculo) {
      return res.status(404).json({ error: "Vehículo no encontrado." });
    }

    // Asociar usuario al vehículo
    await vehiculo.addUsuario(usuario);

    res.status(200).json({ message: "Usuario asociado correctamente al vehículo." });
  } catch (error) {
    res.status(500).json({ error: "Error al asociar el vehículo al usuario.", detalles: error.message });
  }
};*/