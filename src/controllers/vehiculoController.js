import Vehiculo from "../models/Vehiculo.js";
import { Usuario } from "../models/index.js";

// Función para registrar un nuevo vehículo
export const registrarVehiculo = async (req, res) => {
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

// Función para obtener los vehículos asociados a un usuario
export const obtenerVehiculosUsuario = async (req, res) => {
  try {
    const usuarioId = req.params.usuarioId;

    // Comprobación de existencia de usuario
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // Obtener vehículos asociados al usuario, incluyendo los usuarios vinculados
    const vehiculos = await usuario.getVehiculos({
      include: [{
        model: Usuario,
        attributes: ['nombre'],
        through: { attributes: [] } // No incluir datos de la tabla intermedia
      }]
    });

    // Formatear la respuesta para incluir los nombres de los usuarios vinculados
    const resultado = vehiculos.map(vehiculo => ({
      ...vehiculo.toJSON(),
      usuariosVinculados: vehiculo.Usuarios.map(u => u.nombre)
    }));

    res.status(200).json({ vehiculos: resultado });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los vehículos.", detalles: error.message });
  }
};

// Obtener la ubicación de un vehículo
export const obtenerUbicacionVehiculo = async (req, res) => {
  try {
    const vehiculoId = req.params.vehiculoId;
    const usuarioId = req.usuario.id;

    const vehiculo = await Vehiculo.findByPk(vehiculoId, {
      include: [{
        model: Usuario,
        attributes: ['id'],
        through: { attributes: [] }
      }]
    });

    if (!vehiculo) {
      return res.status(404).json({ error: "Vehículo no encontrado." });
    }

    // Comprobar si el usuario está asociado al vehículo
    const vinculado = vehiculo.Usuarios.some(u => u.id === usuarioId);
    if (!vinculado) {
      return res.status(403).json({ error: "No tienes permisos para ver la ubicación de este vehículo." });
    }

    res.status(200).json({ ubicacion_actual: vehiculo.ubicacion_actual });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la ubicación.", detalles: error.message });
  }
};

// Actualizar la ubicación de un vehículo
export const actualizarUbicacionVehiculo = async (req, res) => {
  try {
    const vehiculoId = req.params.vehiculoId;
    const usuarioId = req.usuario.id;
    const { ubicacion_actual } = req.body;

    const vehiculo = await Vehiculo.findByPk(vehiculoId, {
      include: [{
        model: Usuario,
        attributes: ['id'],
        through: { attributes: [] }
      }]
    });

    if (!vehiculo) {
      return res.status(404).json({ error: "Vehículo no encontrado." });
    }

    // Comprobar si el usuario está asociado al vehículo
    const vinculado = vehiculo.Usuarios.some(u => u.id === usuarioId);
    if (!vinculado) {
      return res.status(403).json({ error: "No tienes permisos para actualizar la ubicación de este vehículo." });
    }

    vehiculo.ubicacion_actual = ubicacion_actual;
    await vehiculo.save();

    res.status(200).json({ message: "Ubicación actualizada correctamente.", ubicacion_actual: vehiculo.ubicacion_actual });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la ubicación.", detalles: error.message });
  }
};