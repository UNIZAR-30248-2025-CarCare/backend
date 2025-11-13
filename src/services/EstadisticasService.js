import { DataTypes } from "sequelize";
const isTest = process.env.NODE_ENV === 'test';
const sequelize = isTest 
  ? (await import("../config/database.test.js")).default
  : (await import("../config/database.js")).default;

import Repostaje from "../models/Repostaje.js";
import Viaje from "../models/Viaje.js";

class EstadisticasService {
  static async calcularEstadisticas(vehiculoId, mes, ano) {
    const primerDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0, 23, 59, 59);

    // Obtener datos de repostajes
    const repostajes = await Repostaje.findAll({
      where: {
        vehiculoId,
        fecha: {
          [sequelize.Sequelize.Op.between]: [primerDia, ultimoDia]
        }
      }
    });

    // Obtener datos de viajes
    const viajes = await Viaje.findAll({
      where: {
        vehiculoId,
        fechaHoraInicio: {
          [sequelize.Sequelize.Op.between]: [primerDia, ultimoDia]
        }
      }
    });

    // Calcular estadísticas
    const kmTotales = viajes.reduce((sum, viaje) => sum + (viaje.kmRealizados || 0), 0);
    
    // Calcular horas conducidas desde fechaHoraInicio y fechaHoraFin
    const horasTotales = viajes.reduce((sum, viaje) => {
      if (viaje.fechaHoraInicio && viaje.fechaHoraFin) {
        const inicio = new Date(viaje.fechaHoraInicio);
        const fin = new Date(viaje.fechaHoraFin);
        const diferenciaMilisegundos = fin - inicio;
        const horas = diferenciaMilisegundos / (1000 * 60 * 60); // Convertir a horas
        return sum + (horas > 0 ? horas : 0);
      }
      return sum;
    }, 0);
    
    const litrosTotales = repostajes.reduce((sum, repostaje) => sum + repostaje.litros, 0);
    const gastoTotal = repostajes.reduce((sum, repostaje) => sum + repostaje.precioTotal, 0);
    const consumoPromedio = kmTotales > 0 ? (litrosTotales / kmTotales) * 100 : 0;

    return {
      kmTotales: Math.round(kmTotales),
      horasTotales: Math.round(horasTotales * 100) / 100,
      consumoPromedio: Math.round(consumoPromedio * 100) / 100,
      gastoTotal: Math.round(gastoTotal * 100) / 100,
      litrosTotales: Math.round(litrosTotales * 100) / 100
    };
  }
}

export default EstadisticasService;