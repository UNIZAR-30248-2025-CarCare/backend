import  Usuario  from "./Usuario.js";
import  Vehiculo  from "./Vehiculo.js";
import Invitacion from "./Invitacion.js";

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


export { Usuario, Vehiculo, Invitacion };
