import bcrypt from "bcrypt";
import { Usuario, Vehiculo, Invitacion, Logro } from "../models/index.js";

async function seedDatabase() {
  try {
    console.log("🌱 Iniciando seed de la base de datos...");

    // Verificar si ya hay datos
    const usuariosCount = await Usuario.count();
    if (usuariosCount > 0) {
      console.log("⚠️  La base de datos ya contiene datos. Saltando seed.");
      return;
    }

    const hashedPassword = "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"

    // 1. Crear usuarios
    console.log("👥 Creando usuarios...");
    const usuarios = await Usuario.bulkCreate([
      {
        nombre: "Juan Pérez",
        email: "juan.perez@email.com",
        contrasegna: hashedPassword,
        fecha_nacimiento: "1990-05-15",
        ubicaciones_preferidas: [],
      },
      {
        nombre: "María García",
        email: "maria.garcia@email.com",
        contrasegna: hashedPassword,
        fecha_nacimiento: "1985-08-22",
        ubicaciones_preferidas: [
          {
            nombre: "Taller Central",
            direccion: "Calle Mayor 45",
            latitud: 41.6488,
            longitud: -0.8891,
          },
        ],
      },
      {
        nombre: "Carlos Rodríguez",
        email: "carlos.rodriguez@email.com",
        contrasegna: hashedPassword,
        fecha_nacimiento: "1992-03-10",
        ubicaciones_preferidas: [],
      },
      {
        nombre: "Ana Martínez",
        email: "ana.martinez@email.com",
        contrasegna: hashedPassword,
        fecha_nacimiento: "1988-11-30",
        ubicaciones_preferidas: [
          {
            nombre: "Gasolinera Norte",
            direccion: "Avda. Goya 120",
            latitud: 41.656,
            longitud: -0.8773,
          },
        ],
      },
      {
        nombre: "Luis Fernández",
        email: "luis.fernandez@email.com",
        contrasegna: hashedPassword,
        fecha_nacimiento: "1995-07-18",
        ubicaciones_preferidas: [],
      },
    ]);

    // 2. Crear vehículos
    console.log("🚗 Creando vehículos...");
    const vehiculos = await Vehiculo.bulkCreate([
      {
        nombre: "Mi Seat León",
        matricula: "1234ABC",
        modelo: "León",
        fabricante: "Seat",
        antiguedad: 5,
        tipo_combustible: "diesel",
        litros_combustible: 45.5,
        consumo_medio: 5.2,
        ubicacion_actual: { latitud: 41.6488, longitud: -0.8891 },
        estado: "activo",
      },
      {
        nombre: "Toyota Familiar",
        matricula: "5678DEF",
        modelo: "Corolla",
        fabricante: "Toyota",
        antiguedad: 3,
        tipo_combustible: "hibrido",
        litros_combustible: 38.0,
        consumo_medio: 4.5,
        ubicacion_actual: { latitud: 41.652, longitud: -0.885 },
        estado: "activo",
      },
      {
        nombre: "BMW Deportivo",
        matricula: "9012GHI",
        modelo: "Serie 3",
        fabricante: "BMW",
        antiguedad: 7,
        tipo_combustible: "gasolina",
        litros_combustible: 52.0,
        consumo_medio: 7.8,
        ubicacion_actual: { latitud: 41.656, longitud: -0.8773 },
        estado: "activo",
      },
      {
        nombre: "Renault Eléctrico",
        matricula: "3456JKL",
        modelo: "Zoe",
        fabricante: "Renault",
        antiguedad: 2,
        tipo_combustible: "electrico",
        litros_combustible: 0.0,
        consumo_medio: 15.0,
        ubicacion_actual: { latitud: 41.66, longitud: -0.88 },
        estado: "activo",
      },
      {
        nombre: "Ford Transit",
        matricula: "7890MNO",
        modelo: "Transit",
        fabricante: "Ford",
        antiguedad: 10,
        tipo_combustible: "diesel",
        litros_combustible: 70.0,
        consumo_medio: 8.5,
        ubicacion_actual: null,
        estado: "mantenimiento",
      },
    ]);

    // 3. Asociar usuarios con vehículos
    console.log("🔗 Asociando usuarios con vehículos...");
    await usuarios[0].addVehiculo(vehiculos[0]); // Juan -> Seat León
    await usuarios[1].addVehiculos([vehiculos[1], vehiculos[3]]); // María -> Toyota y Renault
    await usuarios[2].addVehiculo(vehiculos[2]); // Carlos -> BMW
    await usuarios[3].addVehiculo(vehiculos[1]); // Ana -> Toyota (compartido con María)
    await usuarios[4].addVehiculo(vehiculos[4]); // Luis -> Ford Transit

    // 4. Crear invitaciones
    console.log("📨 Creando invitaciones...");
    const fechaActual = new Date();
    const en7Dias = new Date(fechaActual.getTime() + 7 * 24 * 60 * 60 * 1000);
    const en14Dias = new Date(fechaActual.getTime() + 14 * 24 * 60 * 60 * 1000);
    const hace2Dias = new Date(fechaActual.getTime() - 2 * 24 * 60 * 60 * 1000);

    await Invitacion.bulkCreate([
      {
        vehiculoId: vehiculos[0].id,
        creadoPorId: usuarios[0].id,
        usuarioInvitadoId: null,
        codigo: "abc123def456ghi789jkl012mno345pqr678stu901vwx234yzA567BCD890EFG",
        fechaCreacion: fechaActual,
        fechaExpiracion: en7Dias,
        usado: false,
      },
      {
        vehiculoId: vehiculos[1].id,
        creadoPorId: usuarios[1].id,
        usuarioInvitadoId: usuarios[3].id,
        codigo: "xyz789abc123def456ghi789jkl012mno345pqr678stu901vwx234yzA567BCD890",
        fechaCreacion: hace2Dias,
        fechaExpiracion: en7Dias,
        usado: true,
      },
      {
        vehiculoId: vehiculos[2].id,
        creadoPorId: usuarios[2].id,
        usuarioInvitadoId: null,
        codigo: "mno345pqr678stu901vwx234yzA567BCD890EFGabc123def456ghi789jkl012",
        fechaCreacion: fechaActual,
        fechaExpiracion: en14Dias,
        usado: false,
      },
    ]);
    // 5. Crear logros
    console.log("🏆 Creando logros...");
    await Logro.bulkCreate([
      {
        nombre: "Primer Paso",
        descripcion: "Completa tu primer viaje",
        tipo: "VIAJES",
        criterio: 1,
        icono: "🚗",
        puntos: 5,
        activo: true
      },
      {
        nombre: "Viajero Frecuente",
        descripcion: "Completa 10 viajes",
        tipo: "VIAJES",
        criterio: 10,
        icono: "✈️",
        puntos: 15,
        activo: true
      },
      {
        nombre: "Aventurero",
        descripcion: "Completa 50 viajes",
        tipo: "VIAJES",
        criterio: 50,
        icono: "🌍",
        puntos: 30,
        activo: true
      },
      {
        nombre: "Explorador",
        descripcion: "Recorre 100 kilómetros",
        tipo: "DISTANCIA",
        criterio: 100,
        icono: "🗺️",
        puntos: 10,
        activo: true
      },
      {
        nombre: "Trotamundos",
        descripcion: "Recorre 500 kilómetros",
        tipo: "DISTANCIA",
        criterio: 500,
        icono: "🚙",
        puntos: 25,
        activo: true
      },
      {
        nombre: "Vuelta al Mundo",
        descripcion: "Recorre 1000 kilómetros",
        tipo: "DISTANCIA",
        criterio: 1000,
        icono: "🌐",
        puntos: 50,
        activo: true
      },
      {
        nombre: "Primera Reserva",
        descripcion: "Crea tu primera reserva",
        tipo: "RESERVAS",
        criterio: 1,
        icono: "📅",
        puntos: 5,
        activo: true
      },
      {
        nombre: "Planificador Experto",
        descripcion: "Crea 10 reservas",
        tipo: "RESERVAS",
        criterio: 10,
        icono: "📆",
        puntos: 15,
        activo: true
      },
      {
        nombre: "Primer Repostaje",
        descripcion: "Realiza tu primer repostaje",
        tipo: "REPOSTAJES",
        criterio: 1,
        icono: "⛽",
        puntos: 5,
        activo: true
      },
      {
        nombre: "Maestro del Repostaje",
        descripcion: "Realiza 10 repostajes",
        tipo: "REPOSTAJES",
        criterio: 10,
        icono: "⛽",
        puntos: 15,
        activo: true
      },
      {
        nombre: "Coleccionista Iniciado",
        descripcion: "Registra tu primer vehículo",
        tipo: "VEHICULOS",
        criterio: 1,
        icono: "🚘",
        puntos: 5,
        activo: true
      },
      {
        nombre: "Coleccionista",
        descripcion: "Registra 3 vehículos",
        tipo: "VEHICULOS",
        criterio: 3,
        icono: "🚙",
        puntos: 20,
        activo: true
      }
    ]);
    console.log("✅ Seed completado exitosamente!");
    console.log("\n📊 Datos creados:");
    console.log(`   - ${usuarios.length} usuarios`);
    console.log(`   - ${vehiculos.length} vehículos`);
    console.log(`   - 3 invitaciones`);
    console.log("\n🔑 Credenciales de prueba:");
    console.log("   Email: juan.perez@email.com");
    console.log("   Contraseña: password123");
    console.log("\n   (Todos los usuarios tienen la misma contraseña)\n");
  } catch (error) {
    console.error("❌ Error al ejecutar el seed:", error);
    throw error;
  }
}

export default seedDatabase;