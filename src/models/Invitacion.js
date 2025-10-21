import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Invitacion = sequelize.define("Invitacion", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  vehiculoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  creadoPorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  usuarioInvitadoId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Puede ser nulo hasta que el invitado acepte
  },
  codigo: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  fechaCreacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fechaExpiracion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  usado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

export default Invitacion;
