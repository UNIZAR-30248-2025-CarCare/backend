import { DataTypes } from "sequelize";

const isTest = process.env.NODE_ENV === 'test';
const sequelize = isTest 
  ? (await import("../config/database.test.js")).default
  : (await import("../config/database.js")).default;

const UsuarioLogro = sequelize.define("UsuarioLogro", {
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'Usuarios',
      key: 'id'
    }
  },
  logroId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'Logros',
      key: 'id'
    }
  },
  progreso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Progreso actual hacia el criterio del logro'
  },
  desbloqueado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  fechaObtenido: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  }
});

export default UsuarioLogro;