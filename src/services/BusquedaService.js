import { Op } from "sequelize";
import Viaje from "../models/Viaje.js";
//import Repostaje from "../models/Repostaje.js";
import Incidencia from "../models/Incidencia.js";
import Reserva from "../models/Reserva.js";
import Revision from "../models/Revision.js";
import Vehiculo from "../models/Vehiculo.js";
import Usuario  from "../models/Usuario.js";

const busquedaGlobal = async (vehiculoId, query, userId) => {
  // Verificar que el usuario tenga acceso al vehículo (relación N:M)
  const usuario = await Usuario.findOne({
    where: { id: userId },
    include: [{
      model: Vehiculo,
      where: { id: vehiculoId }
    }]
  });

  if (!usuario) {
    throw new Error("Vehículo no encontrado o sin acceso");
  }

  const searchPattern = `%${query}%`;

  // Búsqueda en viajes
  const viajesRaw = await Viaje.findAll({
    where: {
      vehiculoId,
      [Op.or]: [
        { nombre: { [Op.like]: searchPattern } },
        { descripcion: { [Op.like]: searchPattern } }
      ]
    },
    include: [{
      model: Usuario,
      attributes: ['nombre']
    }],
    order: [["fechaHoraInicio", "DESC"]],
    limit: 10
  });

  // Añadir campo usuario con el nombre
  const viajes = viajesRaw.map(viaje => ({
    ...viaje.toJSON(),
    usuario: viaje.Usuario ? viaje.Usuario.nombre : null
  }));

  /*
  // Búsqueda en repostajes
  const repostajes = await Repostaje.findAll({
    where: {
      vehiculoId,
      [Op.or]: [
        { gasolinera: { [Op.like]: searchPattern } },
        { notas: { [Op.like]: searchPattern } }
      ]
    },
    order: [["fecha", "DESC"]],
    limit: 10
  });
  */
  
  // Búsqueda en incidencias
  const incidencias = await Incidencia.findAll({
    where: {
      vehiculoId,
      [Op.or]: [
        { titulo: { [Op.like]: searchPattern } },
        { descripcion: { [Op.like]: searchPattern } }
      ]
    },
    order: [["fechaCreacion", "DESC"]],
    limit: 10
  });
  
  // Búsqueda en reservas
  const reservas = await Reserva.findAll({
    where: {
      vehiculoId,
      [Op.or]: [
        { motivo: { [Op.like]: searchPattern } }
      ]
    },
    order: [["fechaInicio", "DESC"]],
    limit: 10
  });

  // Búsqueda en revisiones
  const revisiones = await Revision.findAll({
    where: {
      vehiculoId,
      [Op.or]: [
        { tipo: { [Op.like]: searchPattern } },
        { taller: { [Op.like]: searchPattern } },
        { observaciones: { [Op.like]: searchPattern } }
      ]
    },
    order: [["fecha", "DESC"]],
    limit: 10
  });

  return {
    viajes,
    //repostajes,
    incidencias,
    reservas,
    revisiones
  };
};

export default {
  busquedaGlobal,
};