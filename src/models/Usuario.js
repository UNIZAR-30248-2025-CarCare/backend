import { DataTypes } from "sequelize";
const isTest = process.env.NODE_ENV === 'test';
const sequelize = isTest 
  ? (await import("../config/database.test.js")).default
  : (await import("../config/database.js")).default;
const Usuario = sequelize.define("Usuario", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  contrasegna: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY, // Almacena solo la fecha (YYYY-MM-DD)
    allowNull: false,
  },
  ubicaciones_preferidas: {
    type: DataTypes.JSON, // Almacena una lista de objetos JSON
    allowNull: true, // Puede ser opcional
    defaultValue: [], // Por defecto, una lista vacía
  },
});

export default Usuario;
