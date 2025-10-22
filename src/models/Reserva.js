import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Reserva = sequelize.define("Reserva", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  motivo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fechaInicio: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  fechaFin: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  horaInicio: {
    type: DataTypes.TIME,
    allowNull: false,
},
  horaFin: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

//Comprobación de que la fecha de fin es posterior a la fecha de inicio
Reserva.addHook("beforeValidate", (reserva, options) => {
  if (reserva.fechaFin <= reserva.fechaInicio) {
    throw new Error("La fecha de fin debe ser posterior a la fecha de inicio.");
  }
});

export default Reserva;
