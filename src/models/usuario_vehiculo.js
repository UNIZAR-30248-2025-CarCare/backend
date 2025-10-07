import  Usuario  from "./Usuario.js";
import  Vehiculo  from "./Vehiculo.js";

// Relación N:M (muchos a muchos)
Usuario.belongsToMany(Vehiculo, { through: "UsuarioVehiculo" });
Vehiculo.belongsToMany(Usuario, { through: "UsuarioVehiculo" });

export { Usuario, Vehiculo };
