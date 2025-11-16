import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupDatabase, cleanDatabase, closeDatabase } from '../seeders/testSetup.js';
import estadisticasRoutes from '../../routes/estadisticasRoutes.js';
import usuarioRoutes from '../../routes/usuarioRoutes.js';
import vehiculoRoutes from '../../routes/vehiculoRoutes.js';
import viajeRoutes from '../../routes/viajeRoutes.js';
import repostajeRoutes from '../../routes/repostajeRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/viajes', viajeRoutes);
app.use('/api/repostajes', repostajeRoutes);

describe('Estadísticas - Tests de Integración', () => {
  let authToken;
  let userId;
  let vehiculoId;

  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Crear usuario de prueba
    const signupResponse = await request(app)
      .post('/api/usuarios/sign-up')
      .send({
        nombre: 'Usuario Test',
        email: 'test@example.com',
        contraseña: 'password123',
        fecha_nacimiento: '2000-01-01'
      });

    // Autenticar usuario
    const loginResponse = await request(app)
      .post('/api/usuarios/sign-in')
      .send({
        email: 'test@example.com',
        contraseña: 'password123'
      });

    authToken = loginResponse.body.token;
    userId = loginResponse.body.userId;

    // Crear vehículo de prueba
    const vehiculoResponse = await request(app)
      .post('/api/vehiculos/registrar')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        usuarioId: userId,
        fabricante: 'Toyota',
        modelo: 'Corolla',
        nombre: 'Mi Toyota',
        antiguedad: 2020,
        matricula: 'BBC 1234',
        tipo_combustible: 'Gasolina',
        consumo_medio: 6.5,
        litros_combustible: 50.5,
        ubicacion_actual: { latitud: 40.4168, longitud: -3.7038 },
        estado: 'Activo',
        tipo: 'Coche'
      });

    vehiculoId = vehiculoResponse.body.vehiculo.id;
  });

  describe('GET /api/estadisticas/:vehiculoId', () => {
    beforeEach(async () => {
      // Crear viajes de prueba para octubre 2025
      await request(app)
        .post('/api/viajes/crearViaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          nombre: 'Viaje 1',
          descripcion: 'Primer viaje',
          fechaHoraInicio: '2025-10-15T08:00:00.000Z',
          fechaHoraFin: '2025-10-15T10:00:00.000Z', // 2 horas
          kmRealizados: 100,
          consumoCombustible: 8,
          ubicacionFinal: { latitud: 40.4168, longitud: -3.7038 }
        });

      await request(app)
        .post('/api/viajes/crearViaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          nombre: 'Viaje 2',
          descripcion: 'Segundo viaje',
          fechaHoraInicio: '2025-10-20T09:00:00.000Z',
          fechaHoraFin: '2025-10-20T12:30:00.000Z', // 3.5 horas
          kmRealizados: 150,
          consumoCombustible: 12,
          ubicacionFinal: { latitud: 41.3851, longitud: 2.1734 }
        });

      // Crear repostajes de prueba para octubre 2025
      await request(app)
        .post('/api/repostajes/crearRepostaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          fecha: '2025-10-10T10:00:00.000Z',
          litros: 40,
          precioPorLitro: 1.5,
          precioTotal: 60
        });

      await request(app)
        .post('/api/repostajes/crearRepostaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          fecha: '2025-10-25T14:00:00.000Z',
          litros: 35,
          precioPorLitro: 1.6,
          precioTotal: 56
        });
    });

    it('debería obtener estadísticas correctamente', async () => {
      const response = await request(app)
        .get(`/api/estadisticas/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ mes: 10, ano: 2025 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('kmTotales', 250); // 100 + 150
      expect(response.body).toHaveProperty('horasTotales', 5.5); // 2 + 3.5
      expect(response.body).toHaveProperty('litrosTotales', 75); // 40 + 35
      expect(response.body).toHaveProperty('gastoTotal', 116); // 60 + 56
      expect(response.body).toHaveProperty('consumoPromedio', 30); // (75/250)*100
    });

    it('debería devolver estadísticas vacías si no hay datos en el mes', async () => {
      const response = await request(app)
        .get(`/api/estadisticas/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ mes: 11, ano: 2025 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('kmTotales', 0);
      expect(response.body).toHaveProperty('horasTotales', 0);
      expect(response.body).toHaveProperty('litrosTotales', 0);
      expect(response.body).toHaveProperty('gastoTotal', 0);
      expect(response.body).toHaveProperty('consumoPromedio', 0);
    });

    it('debería rechazar petición sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/estadisticas/${vehiculoId}`)
        .query({ mes: 10, ano: 2025 });

      expect(response.status).toBe(401);
    });

    it('debería rechazar petición sin parámetro mes', async () => {
      const response = await request(app)
        .get(`/api/estadisticas/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ ano: 2025 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', "Los parámetros 'mes' y 'ano' son obligatorios");
    });

    it('debería rechazar petición sin parámetro año', async () => {
      const response = await request(app)
        .get(`/api/estadisticas/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ mes: 10 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', "Los parámetros 'mes' y 'ano' son obligatorios");
    });

    it('debería rechazar mes inválido (menor a 1)', async () => {
      const response = await request(app)
        .get(`/api/estadisticas/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ mes: 0, ano: 2025 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', "El mes debe estar entre 1 y 12");
    });

    it('debería rechazar mes inválido (mayor a 12)', async () => {
      const response = await request(app)
        .get(`/api/estadisticas/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ mes: 13, ano: 2025 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', "El mes debe estar entre 1 y 12");
    });

    it('debería rechazar año inválido (menor a 2000)', async () => {
      const response = await request(app)
        .get(`/api/estadisticas/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ mes: 10, ano: 1999 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', "Año inválido");
    });

    it('debería rechazar año inválido (mayor a 2100)', async () => {
      const response = await request(app)
        .get(`/api/estadisticas/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ mes: 10, ano: 2101 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', "Año inválido");
    });

    it('debería calcular consumo promedio correctamente sin km', async () => {
      // Crear solo repostajes sin viajes para noviembre
      await request(app)
        .post('/api/repostajes/crearRepostaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          fecha: '2025-11-10T10:00:00.000Z',
          litros: 50,
          precioPorLitro: 1.5,
          precioTotal: 75
        });

      const response = await request(app)
        .get(`/api/estadisticas/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ mes: 11, ano: 2025 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('kmTotales', 0);
      expect(response.body).toHaveProperty('consumoPromedio', 0);
      expect(response.body).toHaveProperty('litrosTotales', 50);
    });

        it('debería calcular horas totales solo para viajes con fechaHoraFin', async () => {
      // Limpiar los viajes de octubre primero para tener un escenario limpio
      await cleanDatabase();
      
      // Recrear usuario y vehículo
      await request(app)
        .post('/api/usuarios/sign-up')
        .send({
          nombre: 'Usuario Test',
          email: 'test@example.com',
          contraseña: 'password123',
          fecha_nacimiento: '2000-01-01'
        });

      const loginResponse = await request(app)
        .post('/api/usuarios/sign-in')
        .send({
          email: 'test@example.com',
          contraseña: 'password123'
        });

      authToken = loginResponse.body.token;
      userId = loginResponse.body.userId;

      const vehiculoResponse = await request(app)
        .post('/api/vehiculos/registrar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          fabricante: 'Toyota',
          modelo: 'Corolla',
          nombre: 'Mi Toyota',
          antiguedad: 2020,
          matricula: 'BBC 1234',
          tipo_combustible: 'Gasolina',
          consumo_medio: 6.5,
          litros_combustible: 50.5,
          ubicacion_actual: { latitud: 40.4168, longitud: -3.7038 },
          estado: 'Activo',
          tipo: 'Coche'
        });

      vehiculoId = vehiculoResponse.body.vehiculo.id;

      // Crear un viaje completo (con fechaHoraFin)
      await request(app)
        .post('/api/viajes/crearViaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          nombre: 'Viaje completo',
          descripcion: 'Con fecha fin',
          fechaHoraInicio: '2025-11-15T08:00:00.000Z',
          fechaHoraFin: '2025-11-15T10:00:00.000Z', // 2 horas
          kmRealizados: 50,
          consumoCombustible: 5,
          ubicacionFinal: { latitud: 40.4168, longitud: -3.7038 }
        });

      // Crear un viaje con fechas muy cercanas (casi 0 horas)
      await request(app)
        .post('/api/viajes/crearViaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          nombre: 'Viaje corto',
          descripcion: 'Muy corto',
          fechaHoraInicio: '2025-11-20T08:00:00.000Z',
          fechaHoraFin: '2025-11-20T08:05:00.000Z', // 0.08 horas (5 minutos)
          kmRealizados: 30,
          consumoCombustible: 3,
          ubicacionFinal: { latitud: 40.4168, longitud: -3.7038 }
        });

      const response = await request(app)
        .get(`/api/estadisticas/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ mes: 11, ano: 2025 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('kmTotales', 80); // 50 + 30
      expect(response.body).toHaveProperty('horasTotales', 2.08); // 2 + 0.08 (redondeado a 2 decimales)
    });
  });
});