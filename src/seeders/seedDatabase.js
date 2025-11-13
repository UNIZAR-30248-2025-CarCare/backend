import bcrypt from "bcrypt";
import { Usuario, Vehiculo, Invitacion, Incidencia } from "../models/index.js";

async function seedDatabase() {
  try {
    console.log("🌱 Iniciando seed de la base de datos...");

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
        tipo_combustible: "Diésel",
        litros_combustible: 45.5,
        consumo_medio: 5.2,
        ubicacion_actual: { latitud: 41.6488, longitud: -0.8891 },
        estado: "Activo",
        tipo: "Coche",
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

    // 5. Crear incidencias
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
        tipo: "Avería",
        prioridad: "Alta",
        titulo: "Ruido extraño en el motor",
        descripcion: "Al arrancar el coche se escucha un ruido metálico que proviene del motor. Ocurre especialmente en frío y desaparece después de unos minutos. Puede ser grave.",
        fotos: [],
        compartirConGrupo: true,
        estado: "Pendiente",
        fechaCreacion: hace1Dia,
        fechaResolucion: null,
      },
      {
        vehiculoId: vehiculos[0].id,
        usuarioId: usuarios[0].id,
        tipo: "Daño",
        prioridad: "Baja",
        titulo: "Arañazo en puerta trasera izquierda",
        descripcion: "Al aparcar en el parking del trabajo, alguien ha rozado la puerta. Es superficial pero visible. Necesita retoque de pintura.",
        fotos: [],
        compartirConGrupo: true,
        estado: "Resuelta",
        fechaCreacion: hace10Dias,
        fechaResolucion: hace7Dias,
      },
      // Incidencias del Toyota (María y Ana)
      {
        vehiculoId: vehiculos[1].id,
        usuarioId: usuarios[1].id,
        tipo: "Avería",
        prioridad: "Media",
        titulo: "Luz de check engine encendida",
        descripcion: "Esta mañana se ha encendido la luz de check engine en el cuadro. El coche funciona aparentemente normal pero es preocupante.",
        fotos: [],
        compartirConGrupo: true,
        estado: "En progreso",
        fechaCreacion: hace2Dias,
        fechaResolucion: null,
      },
      {
        vehiculoId: vehiculos[1].id,
        usuarioId: usuarios[3].id,
        tipo: "Otro",
        prioridad: "Baja",
        titulo: "Limpiaparabrisas hacen ruido",
        descripcion: "Los limpiaparabrisas están dejando marcas y haciendo ruido al limpiar. Probablemente necesiten ser reemplazados.",
        fotos: [],
        compartirConGrupo: true,
        estado: "Pendiente",
        fechaCreacion: hace5Dias,
        fechaResolucion: null,
      },
      // Incidencias del BMW (Carlos)
      {
        vehiculoId: vehiculos[2].id,
        usuarioId: usuarios[2].id,
        tipo: "Avería",
        prioridad: "Alta",
        titulo: "Pérdida de aceite",
        descripcion: "He notado manchas de aceite en el suelo donde aparco. Al revisar, el nivel de aceite está bajo. Necesita revisión urgente en el taller.",
        fotos: [],
        compartirConGrupo: true,
        estado: "En progreso",
        fechaCreacion: hace3Dias,
        fechaResolucion: null,
      },
      {
        vehiculoId: vehiculos[2].id,
        usuarioId: usuarios[2].id,
        tipo: "Daño",
        prioridad: "Media",
        titulo: "Retrovisor derecho roto",
        descripcion: "El retrovisor derecho fue golpeado por un camión en una calle estrecha. La carcasa está rota y el espejo tiene una grieta.",
        fotos: [],
        compartirConGrupo: true,
        estado: "Resuelta",
        fechaCreacion: hace10Dias,
        fechaResolucion: hace5Dias,
      },
      // Incidencias del Renault Eléctrico (María)
      {
        vehiculoId: vehiculos[3].id,
        usuarioId: usuarios[1].id,
        tipo: "Otro",
        prioridad: "Media",
        titulo: "Autonomía reducida",
        descripcion: "La batería no está cargando al 100% como antes. La autonomía ha bajado notablemente en las últimas semanas.",
        fotos: [],
        compartirConGrupo: true,
        estado: "Pendiente",
        fechaCreacion: hace3Dias,
        fechaResolucion: null,
      },
      // Incidencias del Ford Transit (Luis)
      {
        vehiculoId: vehiculos[4].id,
        usuarioId: usuarios[4].id,
        tipo: "Avería",
        prioridad: "Alta",
        titulo: "Problemas con la transmisión",
        descripcion: "La furgoneta no cambia de marcha correctamente. Se siente un golpe al pasar de 2ª a 3ª. Está en el taller desde hace 3 días.",
        fotos: [],
        compartirConGrupo: true,
        estado: "En progreso",
        fechaCreacion: hace5Dias,
        fechaResolucion: null,
      },
      {
        vehiculoId: vehiculos[4].id,
        usuarioId: usuarios[4].id,
        tipo: "Daño",
        prioridad: "Baja",
        titulo: "Parachoques trasero abollado",
        descripcion: "Al dar marcha atrás golpeé un poste. El parachoques tiene una abolladura considerable en la esquina izquierda.",
        fotos: [],
        compartirConGrupo: false,
        estado: "Cancelada",
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