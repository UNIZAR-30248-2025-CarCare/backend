import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Reserva from "./Reserva.js";
const Vehiculo = sequelize.define("Vehiculo", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  matricula: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  modelo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fabricante: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  antiguedad: {
    type: DataTypes.INTEGER, // Años de antigüedad
    allowNull: false,
  },
  tipo_combustible: {
    type: DataTypes.ENUM("Gasolina", "Diésel", "Eléctrico", "Híbrido", "GLP"), // Tipos de combustible
    allowNull: false,
  },
  litros_combustible: {
    type: DataTypes.FLOAT, // Cantidad de combustible en litros
    allowNull: false,
    defaultValue: 0, // Por defecto, 0 litros
  },
  consumo_medio: {
    type: DataTypes.FLOAT, // Consumo medio en litros por 100 km
    allowNull: false,
  },
  ubicacion_actual: {
    type: DataTypes.JSON, // Coordenadas de ubicación actual (latitud y longitud)
    allowNull: true,
    defaultValue: null,
  },
  estado: {
    type: DataTypes.ENUM("Activo", "Inactivo", "Mantenimiento"), // Estado del vehículo
    allowNull: false,
    defaultValue: "Activo",
  },
  tipo: {
    type: DataTypes.ENUM("Coche", "Moto", "Furgoneta", "Camión"), // Tipo de vehículo
    allowNull: false,
    defaultValue: "Coche",
  },
});

export default Vehiculo;
