import { DataTypes } from "sequelize";

const isTest = process.env.NODE_ENV === 'test';
const sequelize = isTest 
  ? (await import("../config/database.test.js")).default
  : (await import("../config/database.js")).default;

const Logro = sequelize.define("Logro", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('DISTANCIA', 'REPOSTAJES', 'VIAJES', 'AHORRO', 'RESERVAS', 'VEHICULOS'),
    allowNull: false,
  },
  criterio: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Valor objetivo para desbloquear (ej: 100 para 100km)'
  },
  icono: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '🏆',
    comment: 'Emoji o nombre del icono'
  },
  puntos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    comment: 'Puntos que otorga al desbloquearse'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  }
});

export default Logro;