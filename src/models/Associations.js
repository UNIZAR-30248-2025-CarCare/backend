import Usuario from "./Usuario.js";
import Vehiculo from "./Vehiculo.js";
import Reserva from "./Reserva.js";
import Invitacion from "./Invitacion.js";
import Viaje from "./Viaje.js";

// Relación N:M (muchos a muchos) entre Usuario y Vehiculo
Usuario.belongsToMany(Vehiculo, { through: "UsuarioVehiculo" });
Vehiculo.belongsToMany(Usuario, { through: "UsuarioVehiculo" });

// Relación 1:N entre Usuario y Reserva
Usuario.hasMany(Reserva, { foreignKey: "usuarioId" });
Reserva.belongsTo(Usuario, { foreignKey: "usuarioId" });

// Relación 1:N entre Vehiculo y Reserva
Vehiculo.hasMany(Reserva, { foreignKey: "vehiculoId" });
Reserva.belongsTo(Vehiculo, { foreignKey: "vehiculoId" });

// Relación 1:N entre Vehiculo e Invitacion
Vehiculo.hasMany(Invitacion, { foreignKey: "vehiculoId" });
Invitacion.belongsTo(Vehiculo, { foreignKey: "vehiculoId" });

// Relación 1:N entre Usuario (creador) e Invitacion
Usuario.hasMany(Invitacion, { foreignKey: "creadoPorId", as: "InvitacionesCreadas" });
Invitacion.belongsTo(Usuario, { foreignKey: "creadoPorId", as: "Creador" });

// Relación 1:N entre Usuario (invitado) e Invitacion
Usuario.hasMany(Invitacion, { foreignKey: "usuarioInvitadoId", as: "InvitacionesRecibidas" });
Invitacion.belongsTo(Usuario, { foreignKey: "usuarioInvitadoId", as: "Invitado" });

// Relación 1:N entre Usuario y Viaje
Usuario.hasMany(Viaje, { foreignKey: "usuarioId" });
Viaje.belongsTo(Usuario, { foreignKey: "usuarioId" });

// Relacion 1:N entre Vehiculo y Viaje
Vehiculo.hasMany(Viaje, { foreignKey: "vehiculoId" });
Viaje.belongsTo(Vehiculo, { foreignKey: "vehiculoId" });

export { Usuario, Vehiculo, Reserva, Invitacion };