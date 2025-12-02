import bcrypt from "bcrypt";
import { Usuario, Vehiculo, Invitacion, Logro, Repostaje, Viaje, Revision, Incidencia } from "../models/index.js";
import sequelize from "../config/database.js";

async function seedDatabase() {
  try {
    console.log("🌱 Iniciando seed de la base de datos...");

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    await sequelize.query('DELETE FROM Repostajes');
    await sequelize.query('DELETE FROM Viajes');
    await sequelize.query('DELETE FROM Revisions');
    await sequelize.query('DELETE FROM Incidencia');
    await sequelize.query('DELETE FROM UsuarioVehiculo');
    await sequelize.query('DELETE FROM Invitacions');
    await sequelize.query('DELETE FROM Vehiculos');
    await sequelize.query('DELETE FROM Usuarios');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Verificar si ya hay datos
    const usuariosCount = await Usuario.count();
    if (usuariosCount > 0) {
      console.log("⚠️  La base de datos ya contiene datos. Saltando seed.");
      return;
    }

    const hashedPassword = "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f";

    // 1. Crear usuarios
    console.log("👥 Creando usuarios...");
    const usuarios = await Usuario.bulkCreate([
      {
        nombre: "Juan Pérez",
        email: "juan.perez@email.com",
        contrasegna: hashedPassword,
        fecha_nacimiento: "1990-05-15",
        ubicaciones_preferidas: [],
        es_premium: false,
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
        es_premium: false,
      },
      {
        nombre: "Carlos Rodríguez",
        email: "carlos.rodriguez@email.com",
        contrasegna: hashedPassword,
        fecha_nacimiento: "1992-03-10",
        ubicaciones_preferidas: [],
        es_premium: false,
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
        es_premium: false,
      },
      {
        nombre: "Luis Fernández",
        email: "luis.fernandez@email.com",
        contrasegna: hashedPassword,
        fecha_nacimiento: "1995-07-18",
        ubicaciones_preferidas: [],
        es_premium: false,
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
        tipo_combustible: "Diésel",
        litros_combustible: 45.5,
        consumo_medio: 5.2,
        ubicacion_actual: { latitud: 41.6488, longitud: -0.8891 },
        estado: "Activo",
        tipo: "Coche",
        propietarioId: usuarios[0].id
      },
      {
        nombre: "Toyota Familiar",
        matricula: "5678DEF",
        modelo: "Corolla",
        fabricante: "Toyota",
        antiguedad: 3,
        tipo_combustible: "Híbrido",
        litros_combustible: 38.0,
        consumo_medio: 4.5,
        ubicacion_actual: { latitud: 41.652, longitud: -0.885 },
        estado: "Activo",
        tipo: "Coche",
        propietarioId: usuarios[1].id
      },
      {
        nombre: "BMW Deportivo",
        matricula: "9012GHI",
        modelo: "Serie 3",
        fabricante: "BMW",
        antiguedad: 7,
        tipo_combustible: "Gasolina",
        litros_combustible: 52.0,
        consumo_medio: 7.8,
        ubicacion_actual: { latitud: 41.656, longitud: -0.8773 },
        estado: "Activo",
        tipo: "Coche",
        propietarioId: usuarios[2].id
      },
      {
        nombre: "Renault Eléctrico",
        matricula: "3456JKL",
        modelo: "Zoe",
        fabricante: "Renault",
        antiguedad: 2,
        tipo_combustible: "Eléctrico",
        litros_combustible: 0.0,
        consumo_medio: 15.0,
        ubicacion_actual: { latitud: 41.66, longitud: -0.88 },
        estado: "Activo",
        tipo: "Coche",
        propietarioId: usuarios[3].id
      },
      {
        nombre: "Ford Transit",
        matricula: "7890MNO",
        modelo: "Transit",
        fabricante: "Ford",
        antiguedad: 10,
        tipo_combustible: "Diésel",
        litros_combustible: 70.0,
        consumo_medio: 8.5,
        ubicacion_actual: null,
        estado: "Mantenimiento",
        tipo: "Furgoneta",
        propietarioId: usuarios[4].id
      },
    ]);

    // 2.1 Crear viajes y revisiones de Juan Pérez para el Seat León
    console.log("🗺️ Creando viajes y revisiones de Juan Pérez para el Seat León...");
    const viajes = await Viaje.bulkCreate([
      {
        usuarioId: usuarios[0].id, // Juan Pérez
        vehiculoId: vehiculos[0].id, // Seat León
        nombre: "Viaje a Madrid",
        descripcion: "Fin de semana en Madrid",
        fechaHoraInicio: new Date("2024-10-10T08:00:00"),
        fechaHoraFin: new Date("2024-10-12T20:00:00"),
        kmRealizados: 650,
        consumoCombustible: 35,
        ubicacionFinal: { latitud: 40.4168, longitud: -3.7038 }
      },
      {
        usuarioId: usuarios[0].id,
        vehiculoId: vehiculos[0].id,
        nombre: "Viaje a Valencia",
        descripcion: "Vacaciones en la playa",
        fechaHoraInicio: new Date("2024-09-01T09:00:00"),
        fechaHoraFin: new Date("2024-09-05T18:00:00"),
        kmRealizados: 700,
        consumoCombustible: 38,
        ubicacionFinal: { latitud: 39.4699, longitud: -0.3763 }
      }
    ]);

    const revisiones = await Revision.bulkCreate([
      {
        usuarioId: usuarios[0].id,
        vehiculoId: vehiculos[0].id,
        fecha: new Date("2024-08-15"),
        tipo: "Aceite",
        kilometraje: 45000,
        observaciones: "Cambio de aceite y filtro",
        proximaRevision: new Date("2025-02-15"),
        taller: "Taller Central"
      },
      {
        usuarioId: usuarios[0].id,
        vehiculoId: vehiculos[0].id,
        fecha: new Date("2024-07-10"),
        tipo: "Frenos",
        kilometraje: 44000,
        observaciones: "Revisión y cambio de pastillas de freno",
        proximaRevision: new Date("2025-01-10"),
        taller: "Taller Central"
      }
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

    // 6. Crear incidencias
    console.log("🔧 Creando incidencias...");
    const hace3Dias = new Date(fechaActual.getTime() - 3 * 24 * 60 * 60 * 1000);
    const hace5Dias = new Date(fechaActual.getTime() - 5 * 24 * 60 * 60 * 1000);
    const hace1Dia = new Date(fechaActual.getTime() - 1 * 24 * 60 * 60 * 1000);
    const hace10Dias = new Date(fechaActual.getTime() - 10 * 24 * 60 * 60 * 1000);
    const hace7Dias = new Date(fechaActual.getTime() - 7 * 24 * 60 * 60 * 1000);

    await Incidencia.bulkCreate([
      // Incidencias del Seat León (Juan)
      {
        vehiculoId: vehiculos[0].id,
        usuarioId: usuarios[0].id,
        tipo: "AVERIA",
        prioridad: "ALTA",
        titulo: "Ruido extraño en el motor",
        descripcion: "Al arrancar el coche se escucha un ruido metálico que proviene del motor. Ocurre especialmente en frío y desaparece después de unos minutos. Puede ser grave.",
        fotos: [],
        compartirConGrupo: true,
        estado: "PENDIENTE",
        fechaCreacion: hace1Dia,
        fechaResolucion: null,
      },
      {
        vehiculoId: vehiculos[0].id,
        usuarioId: usuarios[0].id,
        tipo: "DAÑO",
        prioridad: "BAJA",
        titulo: "Arañazo en puerta trasera izquierda",
        descripcion: "Al aparcar en el parking del trabajo, alguien ha rozado la puerta. Es superficial pero visible. Necesita retoque de pintura.",
        fotos: [],
        compartirConGrupo: true,
        estado: "RESUELTA",
        fechaCreacion: hace10Dias,
        fechaResolucion: hace7Dias,
      },
      // Incidencias del Toyota (María y Ana)
      {
        vehiculoId: vehiculos[1].id,
        usuarioId: usuarios[1].id,
        tipo: "AVERIA",
        prioridad: "MEDIA",
        titulo: "Luz de check engine encendida",
        descripcion: "Esta mañana se ha encendido la luz de check engine en el cuadro. El coche funciona aparentemente normal pero es preocupante.",
        fotos: [],
        compartirConGrupo: true,
        estado: "EN PROGRESO",
        fechaCreacion: hace2Dias,
        fechaResolucion: null,
      },
      {
        vehiculoId: vehiculos[1].id,
        usuarioId: usuarios[3].id,
        tipo: "OTRO",
        prioridad: "BAJA",
        titulo: "Limpiaparabrisas hacen ruido",
        descripcion: "Los limpiaparabrisas están dejando marcas y haciendo ruido al limpiar. Probablemente necesiten ser reemplazados.",
        fotos: [],
        compartirConGrupo: true,
        estado: "PENDIENTE",
        fechaCreacion: hace5Dias,
        fechaResolucion: null,
      },
      // Incidencias del BMW (Carlos)
      {
        vehiculoId: vehiculos[2].id,
        usuarioId: usuarios[2].id,
        tipo: "AVERIA",
        prioridad: "ALTA",
        titulo: "Pérdida de aceite",
        descripcion: "He notado manchas de aceite en el suelo donde aparco. Al revisar, el nivel de aceite está bajo. Necesita revisión urgente en el taller.",
        fotos: [],
        compartirConGrupo: true,
        estado: "EN PROGRESO",
        fechaCreacion: hace3Dias,
        fechaResolucion: null,
      },
      {
        vehiculoId: vehiculos[2].id,
        usuarioId: usuarios[2].id,
        tipo: "DAÑO",
        prioridad: "MEDIA",
        titulo: "Retrovisor derecho roto",
        descripcion: "El retrovisor derecho fue golpeado por un camión en una calle estrecha. La carcasa está rota y el espejo tiene una grieta.",
        fotos: [],
        compartirConGrupo: true,
        estado: "RESUELTA",
        fechaCreacion: hace10Dias,
        fechaResolucion: hace5Dias,
      },
      // Incidencias del Renault Eléctrico (María)
      {
        vehiculoId: vehiculos[3].id,
        usuarioId: usuarios[1].id,
        tipo: "OTRO",
        prioridad: "MEDIA",
        titulo: "Autonomía reducida",
        descripcion: "La batería no está cargando al 100% como antes. La autonomía ha bajado notablemente en las últimas semanas.",
        fotos: [],
        compartirConGrupo: true,
        estado: "PENDIENTE",
        fechaCreacion: hace3Dias,
        fechaResolucion: null,
      },
      // Incidencias del Ford Transit (Luis)
      {
        vehiculoId: vehiculos[4].id,
        usuarioId: usuarios[4].id,
        tipo: "AVERIA",
        prioridad: "ALTA",
        titulo: "Problemas con la transmisión",
        descripcion: "La furgoneta no cambia de marcha correctamente. Se siente un golpe al pasar de 2ª a 3ª. Está en el taller desde hace 3 días.",
        fotos: [],
        compartirConGrupo: true,
        estado: "EN PROGRESO",
        fechaCreacion: hace5Dias,
        fechaResolucion: null,
      },
      {
        vehiculoId: vehiculos[4].id,
        usuarioId: usuarios[4].id,
        tipo: "DAÑO",
        prioridad: "BAJA",
        titulo: "Parachoques trasero abollado",
        descripcion: "Al dar marcha atrás golpeé un poste. El parachoques tiene una abolladura considerable en la esquina izquierda.",
        fotos: [],
        compartirConGrupo: false,
        estado: "CANCELADA",
        fechaCreacion: hace10Dias,
        fechaResolucion: null,
      },
    ]);

    console.log("✅ Seed completado exitosamente!");
    console.log("\n📊 Datos creados:");
    console.log(`   - ${usuarios.length} usuarios`);
    console.log(`   - ${vehiculos.length} vehículos`);
    console.log(`   - 3 invitaciones`);
    console.log(`   - 9 incidencias`);
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