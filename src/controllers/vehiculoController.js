import Vehiculo from "../models/Vehiculo.js";
import Invitacion from "../models/Invitacion.js";
import { Usuario } from "../models/index.js";

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
      tipo
    } = req.body;

    // Imprimir request body para depuración
    console.log("Request Body:", req.body);

    // Validar campos obligatorios
    if (
      usuarioId === undefined || usuarioId === null ||
      nombre === undefined || nombre === null ||
      matricula === undefined || matricula === null ||
      modelo === undefined || modelo === null ||
      fabricante === undefined || fabricante === null ||
      antiguedad === undefined || antiguedad === null ||
      tipo_combustible === undefined || tipo_combustible === null ||
      consumo_medio === undefined || consumo_medio === null
    ) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    // Validar tipo_combustible
    const combustiblesValidos = ["Gasolina", "Diésel", "Eléctrico", "Híbrido", "GLP"];
    if (!combustiblesValidos.includes(tipo_combustible)) {
      return res.status(400).json({ error: "Tipo de combustible no válido." });
    }

    // Validar estado
    const estadosValidos = ["Activo", "Inactivo", "Mantenimiento"];
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({ error: "Estado no válido." });
    }

    // Validar tipo de vehículo
    const tiposValidos = ["Coche", "Moto", "Furgoneta", "Camión"];
    if (tipo && !tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: "Tipo de vehículo no válido." });
    }

    // Validar matrícula duplicada
    const vehiculoExistente = await Vehiculo.findOne({ where: { matricula } });
    if (vehiculoExistente) {
      return res.status(409).json({ error: "La matrícula ya está registrada." });
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
      tipo
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
    const usuarioId = req.usuario.id; // Obtener el ID del usuario desde el token verificado
    const { emailInvitado } = req.body;      // del body JSON enviado por el frontend

    const vehiculo = await Vehiculo.findByPk(vehiculoId);
    if (!vehiculo) return res.status(404).json({ error: "Vehículo no encontrado." });

    // Verificar si el usuario es propietario
    const esPropietario = await vehiculo.hasUsuario(usuarioId);
    if (!esPropietario) return res.status(403).json({ error: "No tienes permisos sobre este vehículo." });

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