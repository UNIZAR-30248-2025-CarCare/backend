import { DataTypes } from "sequelize";
const isTest = process.env.NODE_ENV === 'test';
const sequelize = isTest 
  ? (await import("../config/database.test.js")).default
  : (await import("../config/database.js")).default;

const Repostaje = sequelize.define("Repostaje", {
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
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  litros: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  precioPorLitro: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  precioTotal: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
});

export default Repostaje;
