import Usuario from "./Usuario.js";
import Vehiculo from "./Vehiculo.js";
import Reserva from "./Reserva.js";

// Relaciones
Usuario.hasMany(Reserva, { foreignKey: { name: "UsuarioId", allowNull: false }, onDelete: "CASCADE" });
Vehiculo.hasMany(Reserva, { foreignKey: { name: "VehiculoId", allowNull: false }, onDelete: "CASCADE" });
Reserva.belongsTo(Usuario, { foreignKey: { name: "UsuarioId", allowNull: false }, onDelete: "CASCADE" });
Reserva.belongsTo(Vehiculo, { foreignKey: { name: "VehiculoId", allowNull: false }, onDelete: "CASCADE" });

export { Usuario, Vehiculo, Reserva };