import { Usuario } from "./Usuario.js";
import { Vehiculo } from "./Vehiculo.js";

// Relación N:M (muchos a muchos)
Usuario.belongsToMany(Vehiculo, { through: "UsuarioVehiculos" });
Vehiculo.belongsToMany(Usuario, { through: "UsuarioVehiculos" });

export { Usuario, Vehiculo };
