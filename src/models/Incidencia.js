import { DataTypes } from "sequelize";
const isTest = process.env.NODE_ENV === 'test';
const sequelize = isTest 
  ? (await import("../config/database.test.js")).default
  : (await import("../config/database.js")).default;


const Incidencia = sequelize.define("Incidencia", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  vehiculoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Vehiculos',
      key: 'id'
    }
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.ENUM("AVERIA", "ACCIDENTE", "MANTENIMIENTO", "OTRO"),
    allowNull: false,
  },
  prioridad: {
    type: DataTypes.ENUM("ALTA", "MEDIA", "BAJA"),
    allowNull: false,
    defaultValue: "Media",
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  fotos: {
    type: DataTypes.JSON, // Array de URLs de fotos
    allowNull: true,
    defaultValue: [],
  },
  compartirConGrupo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  estado: {
    type: DataTypes.ENUM("Pendiente", "En progreso", "Resuelta", "Cancelada"),
    allowNull: false,
    defaultValue: "Pendiente",
  },
  fechaCreacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fechaResolucion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

export default Incidencia;