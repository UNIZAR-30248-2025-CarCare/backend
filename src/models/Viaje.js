import { DataTypes } from "sequelize";
const isTest = process.env.NODE_ENV === 'test';
const sequelize = isTest 
  ? (await import("../config/database.test.js")).default
  : (await import("../config/database.js")).default;

const Viaje = sequelize.define("Viaje", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  vehiculoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fechaHoraInicio: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  fechaHoraFin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  kmRealizados: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  consumoCombustible: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  ubicacionFinal: {
    type: DataTypes.JSON, // { latitud: float, longitud: float }
    allowNull: false,
  },
});

export default Viaje;
