import "../models/associations.js";
import Reserva from "../models/Reserva.js";
import Usuario from "../models/Usuario.js";
import Vehiculo from "../models/Vehiculo.js";
import sequelize from "../config/database.js";

beforeAll(async () => {
  await sequelize.sync({ force: true });
  
  // Crear usuario de prueba
  await Usuario.create({
    nombre: "Test User",
    email: "test@example.com",
    contraseña: "123456",
    fecha_nacimiento: "2000-01-01",
  });
  
  // Crear vehículo de prueba
  await Vehiculo.create({
    nombre: "Test Car",
    matricula: "ABC123",
    modelo: "Modelo X",
    fabricante: "Marca Y",
    antiguedad: 2,
    tipo_combustible: "gasolina",
    litros_combustible: 10,
    consumo_medio: 5,
    estado: "activo",
  });
});

afterAll(async () => {
  await sequelize.close();
});

test("Reserva se crea correctamente con datos válidos", async () => {
  const usuario = await Usuario.findOne();
  const vehiculo = await Vehiculo.findOne();

  const reserva = await Reserva.create({
    motivo: "Viaje de prueba",
    fechaInicio: new Date("2025-10-22"),
    fechaFin: new Date("2025-10-23"),
    horaInicio: "09:00:00",
    horaFin: "17:00:00",
    descripcion: "Test de reserva",
    UsuarioId: usuario.id,
    VehiculoId: vehiculo.id,
  });

  expect(reserva).toBeDefined();
  expect(reserva.motivo).toBe("Viaje de prueba");
  expect(reserva.UsuarioId).toBe(usuario.id);
  expect(reserva.VehiculoId).toBe(vehiculo.id);
});

test("Reserva falla si fechaFin es anterior a fechaInicio", async () => {
  const usuario = await Usuario.findOne();
  const vehiculo = await Vehiculo.findOne();

  await expect(
    Reserva.create({
      motivo: "Viaje inválido",
      fechaInicio: new Date("2025-10-23"),
      fechaFin: new Date("2025-10-22"),
      horaInicio: "09:00:00",
      horaFin: "17:00:00",
      UsuarioId: usuario.id,
      VehiculoId: vehiculo.id,
    })
  ).rejects.toThrow("La fecha de fin debe ser posterior a la fecha de inicio.");
});

test("Reserva se puede actualizar correctamente", async () => {
  const reserva = await Reserva.findOne();
  
  reserva.motivo = "Motivo actualizado";
  await reserva.save();

  const reservaActualizada = await Reserva.findByPk(reserva.id);
  expect(reservaActualizada.motivo).toBe("Motivo actualizado");
});

test("Reserva se puede eliminar correctamente", async () => {
  const reserva = await Reserva.findOne();
  await reserva.destroy();

  const reservaEliminada = await Reserva.findByPk(reserva.id);
  expect(reservaEliminada).toBeNull();
});