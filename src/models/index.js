import Usuario from "./Usuario.js";
import Vehiculo from "./Vehiculo.js";
import Invitacion from "./Invitacion.js";
import Viaje from "./Viaje.js";
import Repostaje from "./Repostaje.js";

// Relación N:M (muchos a muchos)
Usuario.belongsToMany(Vehiculo, { through: "UsuarioVehiculo" });
Vehiculo.belongsToMany(Usuario, { through: "UsuarioVehiculo" });

// Relación Vehiculo <-> Invitacion
Vehiculo.hasMany(Invitacion, { foreignKey: "vehiculoId" });
Invitacion.belongsTo(Vehiculo, { foreignKey: "vehiculoId" });

// Relación Usuario <-> Invitacion (creador)
Usuario.hasMany(Invitacion, { foreignKey: "creadoPorId", as: "invitacionesCreadas" });
Invitacion.belongsTo(Usuario, { foreignKey: "creadoPorId", as: "creador" });

// Relación Usuario <-> Invitacion (invitado)
Usuario.hasMany(Invitacion, { foreignKey: "usuarioInvitadoId", as: "invitacionesRecibidas" });
Invitacion.belongsTo(Usuario, { foreignKey: "usuarioInvitadoId", as: "invitado" });

// Relación 1:N entre Usuario y Viaje
Usuario.hasMany(Viaje, { foreignKey: "usuarioId" });
Viaje.belongsTo(Usuario, { foreignKey: "usuarioId" });

// Relación 1:N entre Vehiculo y Viaje
Vehiculo.hasMany(Viaje, { foreignKey: "vehiculoId" });
Viaje.belongsTo(Vehiculo, { foreignKey: "vehiculoId" });

// Relación 1:N entre Usuario y Repostaje
Usuario.hasMany(Repostaje, { foreignKey: "usuarioId" });
Repostaje.belongsTo(Usuario, { foreignKey: "usuarioId" });

// Relación 1:N entre Vehiculo y Repostaje
Vehiculo.hasMany(Repostaje, { foreignKey: "vehiculoId" });
Repostaje.belongsTo(Vehiculo, { foreignKey: "vehiculoId" });

// Una Incidencia pertenece a un Vehículo
Incidencia.belongsTo(Vehiculo, { foreignKey: "vehiculoId",onDelete: "CASCADE"});
Vehiculo.hasMany(Incidencia, { foreignKey: "vehiculoId",onDelete: "CASCADE"});

// Una Incidencia pertenece a un Usuario (creador)
Incidencia.belongsTo(Usuario, { foreignKey: "usuarioId", onDelete: "CASCADE" });
Usuario.hasMany(Incidencia, { foreignKey: "usuarioId", onDelete: "CASCADE" });

// Relación 1:N entre Usuario y Revision
Usuario.hasMany(Revision, { foreignKey: "usuarioId" });
Revision.belongsTo(Usuario, { foreignKey: "usuarioId" });

// Relación 1:N entre Vehiculo y Revision
Vehiculo.hasMany(Revision, { foreignKey: "vehiculoId" });
Revision.belongsTo(Vehiculo, { foreignKey: "vehiculoId" });

export { Usuario, Vehiculo, Invitacion, Viaje, Repostaje, Revision, Incidencia };

