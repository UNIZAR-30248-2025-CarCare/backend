import Viaje from "../models/Viaje.js";
import Vehiculo from "../models/Vehiculo.js";
import Usuario from "../models/Usuario.js";

export const crearViaje = async (req, res) => {
  try {
    const {
      usuarioId,
      vehiculoId,
      nombre,
      descripcion,
      fechaHoraInicio,
      fechaHoraFin,
      kmRealizados,
      consumoCombustible,
      ubicacionFinal // { latitud, longitud }
    } = req.body;

    // Comprobar que el usuario existe
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(400).json({ error: "El usuario no existe" });
    }

    // Comprobar que el vehículo existe
    const vehiculo = await Vehiculo.findByPk(vehiculoId);
    if (!vehiculo) {
      return res.status(400).json({ error: "El vehículo no existe" });
    }

    // Comprobar nombre y descripción
    if (typeof nombre !== "string" || !nombre.trim()) {
      return res.status(400).json({ error: "El nombre debe ser un string no vacío" });
    }
    if (typeof descripcion !== "string" || !descripcion.trim()) {
      return res.status(400).json({ error: "La descripción debe ser un string no vacío" });
    }

    // Comprobar fechas
    const inicio = new Date(fechaHoraInicio);
    const fin = new Date(fechaHoraFin);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({ error: "Las fechas deben tener un formato válido" });
    }
    if (inicio > fin) {
      return res.status(400).json({ error: "La fecha de inicio no puede ser mayor que la de fin" });
    }

    // Comprobar kmRealizados
    if (typeof kmRealizados !== "number" || kmRealizados <= 0) {
      return res.status(400).json({ error: "Los km realizados deben ser un número mayor que 0" });
    }

    // Comprobar consumoCombustible
    if (typeof consumoCombustible !== "number" || consumoCombustible <= 0) {
      return res.status(400).json({ error: "El consumo de combustible debe ser un número mayor que 0" });
    }

    // Comprobar ubicación final
    if (
      !ubicacionFinal ||
      typeof ubicacionFinal.latitud !== "number" ||
      typeof ubicacionFinal.longitud !== "number"
    ) {
      return res.status(400).json({ error: "La ubicación final debe tener latitud y longitud numéricas" });
    }

    // Crear el viaje
    const viaje = await Viaje.create({
      usuarioId,
      vehiculoId,
      nombre,
      descripcion,
      fechaHoraInicio,
      fechaHoraFin,
      kmRealizados,
      consumoCombustible,
      ubicacionFinal
    });

    // Actualizar la ubicación actual del vehículo
    await Vehiculo.update(
      { ubicacion_actual: ubicacionFinal },
      { where: { id: vehiculoId } }
    );

    res.status(201).json({ viaje });
  } catch (error) {
    res.status(500).json({ error: "Error al crear el viaje", detalles: error.message });
  }
};

export const obtenerViajes = async (req, res) => {
  try {
    const { vehiculoId } = req.params;
    const viajes = await Viaje.findAll({
      where: { vehiculoId },
      include: [
        {
          model: Usuario,
          attributes: ["nombre"], // Solo el nombre
        }
      ]
    });

    // Formatear la respuesta para reemplazar usuarioId por nombre
    const viajesConNombre = viajes.map(v => {
      const viaje = v.toJSON();
      viaje.usuario = viaje.Usuario?.nombre || null;
      delete viaje.usuarioId;
      delete viaje.Usuario;
      return viaje;
    });

    res.status(200).json({ viajes: viajesConNombre });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los viajes", detalles: error.message });
  }
};