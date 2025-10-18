import Vehiculo from "../models/Vehiculo.js";
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