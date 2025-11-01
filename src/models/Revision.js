import { DataTypes } from "sequelize";
const isTest = process.env.NODE_ENV === 'test';
const sequelize = isTest 
  ? (await import("../config/database.test.js")).default
  : (await import("../config/database.js")).default;

const Revision = sequelize.define("Revision", {
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
  tipo: {
    type: DataTypes.ENUM("Aceite", "Motor", "Frenos", "Neumáticos", "Transmisión", "Suspensión",
                             "Dirección", "Sistema eléctrico", "Sistema de escape","Climatización", "ITV", "Seguridad", "Otros"),
    allowNull: false,
  },
  kilometraje: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  proximaRevision: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  taller: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

export default Revision;
