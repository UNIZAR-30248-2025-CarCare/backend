import Vehiculo from "../models/Vehiculo.js";

// Función para registrar un nuevo vehículo
export const registrar = async (req, res) => {
  try {
    const {
      nombre,
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
    if (!nombre || !modelo || !fabricante || !antiguedad || !tipo_combustible || !consumo_medio) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    // Crear el nuevo vehículo
    const nuevoVehiculo = await Vehiculo.create({
      nombre,
      modelo,
      fabricante,
      antiguedad,
      tipo_combustible,
      litros_combustible,
      consumo_medio,
      ubicacion_actual,
      estado,
    });

    res.status(200).json({ message: "Vehículo registrado exitosamente.", vehiculo: nuevoVehiculo });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar el vehículo.", detalles: error.message });
  }
};