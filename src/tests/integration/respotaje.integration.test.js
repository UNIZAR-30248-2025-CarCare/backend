import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupDatabase, cleanDatabase, closeDatabase } from '../seeders/testSetup.js';
import repostajeRoutes from '../../routes/repostajeRoutes.js';
import usuarioRoutes from '../../routes/usuarioRoutes.js';
import vehiculoRoutes from '../../routes/vehiculoRoutes.js';
import viajeRoutes from '../../routes/viajeRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/repostajes', repostajeRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/viajes', viajeRoutes);

describe('Repostaje - Tests de Integración', () => {
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
    await request(app)
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
        matricula: 'ABC1234',
        tipo_combustible: 'Gasolina',
        consumo_medio: 6.5,
        litros_combustible: 50.5,
        ubicacion_actual: { latitud: 40.4168, longitud: -3.7038 },
        estado: 'Activo',
        tipo: 'Coche'
      });

    vehiculoId = vehiculoResponse.body.vehiculo.id;
  });

  describe('POST /api/repostajes/crearRepostaje', () => {
    const repostajeValido = {
      fecha: '2025-10-28T10:00:00.000Z',
      litros: 45.5,
      precioPorLitro: 1.5,
      precioTotal: 68.25
    };

    it('debería crear un repostaje exitosamente', async () => {
      const response = await request(app)
        .post('/api/repostajes/crearRepostaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          ...repostajeValido
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('litros', 45.5);
      expect(response.body).toHaveProperty('precioTotal', 68.25);
    });

    it('debería rechazar repostaje sin autenticación', async () => {
      const response = await request(app)
        .post('/api/repostajes/crearRepostaje')
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          ...repostajeValido
        });

      expect(response.status).toBe(401);
    });

    it('debería rechazar repostaje con usuario inexistente', async () => {
      const response = await request(app)
        .post('/api/repostajes/crearRepostaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: 9999,
          vehiculoId: vehiculoId,
          ...repostajeValido
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'El usuario no existe');
    });

    it('debería rechazar repostaje con vehículo inexistente', async () => {
      const response = await request(app)
        .post('/api/repostajes/crearRepostaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: 9999,
          ...repostajeValido
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'El vehículo no existe');
    });

    it('debería rechazar fecha inválida', async () => {
      const response = await request(app)
        .post('/api/repostajes/crearRepostaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          ...repostajeValido,
          fecha: 'invalid-date'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'La fecha no es válida');
    });

    it('debería rechazar litros negativos', async () => {
      const response = await request(app)
        .post('/api/repostajes/crearRepostaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          ...repostajeValido,
          litros: -10
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('litros');
    });

    it('debería rechazar precio por litro negativo', async () => {
      const response = await request(app)
        .post('/api/repostajes/crearRepostaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          ...repostajeValido,
          precioPorLitro: -1.5
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('precio por litro');
    });

    it('debería rechazar precio total negativo', async () => {
      const response = await request(app)
        .post('/api/repostajes/crearRepostaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          ...repostajeValido,
          precioTotal: -50
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('precio total');
    });
  });

  describe('GET /api/repostajes/obtenerRepostajesVehiculo/:vehiculoId', () => {
    beforeEach(async () => {
      // Crear algunos repostajes de prueba
      await request(app)
        .post('/api/repostajes/crearRepostaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          fecha: '2025-10-28T10:00:00.000Z',
          litros: 45.5,
          precioPorLitro: 1.5,
          precioTotal: 68.25
        });

      await request(app)
        .post('/api/repostajes/crearRepostaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          fecha: '2025-10-29T10:00:00.000Z',
          litros: 50.0,
          precioPorLitro: 1.6,
          precioTotal: 80.0
        });
    });

    it('debería obtener todos los repostajes de un vehículo con totales', async () => {
      const response = await request(app)
        .get(`/api/repostajes/obtenerRepostajesVehiculo/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('repostajes');
      expect(response.body.repostajes).toHaveLength(2);
      expect(response.body).toHaveProperty('totalLitros', 95.5);
      expect(response.body).toHaveProperty('totalPrecio', 148.25);
    });

    it('debería devolver array vacío si el vehículo no tiene repostajes', async () => {
      // Crear otro vehículo sin repostajes
      const otroVehiculoResponse = await request(app)
        .post('/api/vehiculos/registrar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
            usuarioId: userId,
            fabricante: 'Toyota',
            modelo: 'Corolla',
            nombre: 'Mi Toyota',
            antiguedad: 2020,
            matricula: '1234 BBC',
            tipo_combustible: 'Gasolina',
            consumo_medio: 6.5,
            litros_combustible: 50.5,
            ubicacion_actual: { latitud: 40.4168, longitud: -3.7038 },
            estado: 'Activo',
            tipo: 'Coche'
        });

      const response = await request(app)
        .get(`/api/repostajes/obtenerRepostajesVehiculo/${otroVehiculoResponse.body.vehiculo.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.repostajes).toHaveLength(0);
      expect(response.body.totalLitros).toBe(0);
      expect(response.body.totalPrecio).toBe(0);
    });

    it('debería rechazar petición sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/repostajes/obtenerRepostajesVehiculo/${vehiculoId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/repostajes/calcularProximoRepostaje/:vehiculoId', () => {
    beforeEach(async () => {
      // Crear segundo usuario
      await request(app)
        .post('/api/usuarios/sign-up')
        .send({
          nombre: 'Usuario 2',
          email: 'test2@example.com',
          contraseña: 'password123',
          fecha_nacimiento: '2000-01-01'
        });

      const login2Response = await request(app)
        .post('/api/usuarios/sign-in')
        .send({
          email: 'test2@example.com',
          contraseña: 'password123'
        });

      const userId2 = login2Response.body.userId;
      const authToken2 = login2Response.body.token;

      // Crear viajes
      await request(app)
        .post('/api/viajes/crearViaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          nombre: 'Viaje 1',
          descripcion: 'Primer viaje',
          fechaHoraInicio: '2025-10-28T08:00:00.000Z',
          fechaHoraFin: '2025-10-28T10:00:00.000Z',
          kmRealizados: 100,
          consumoCombustible: 10,
          ubicacionFinal: { latitud: 40.4168, longitud: -3.7038 }
        });

      await request(app)
        .post('/api/viajes/crearViaje')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          usuarioId: userId2,
          vehiculoId: vehiculoId,
          nombre: 'Viaje 2',
          descripcion: 'Segundo viaje',
          fechaHoraInicio: '2025-10-29T08:00:00.000Z',
          fechaHoraFin: '2025-10-29T10:00:00.000Z',
          kmRealizados: 200,
          consumoCombustible: 20,
          ubicacionFinal: { latitud: 41.3851, longitud: 2.1734 }
        });

      // Crear repostajes
      await request(app)
        .post('/api/repostajes/crearRepostaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          fecha: '2025-10-28T10:00:00.000Z',
          litros: 45.5,
          precioPorLitro: 1.5,
          precioTotal: 90
        });

      await request(app)
        .post('/api/repostajes/crearRepostaje')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          usuarioId: userId2,
          vehiculoId: vehiculoId,
          fecha: '2025-10-29T10:00:00.000Z',
          litros: 50.0,
          precioPorLitro: 1.6,
          precioTotal: 30
        });
    });

    it('debería calcular correctamente el próximo repostaje', async () => {
      const response = await request(app)
        .get(`/api/repostajes/calcularProximoRepostaje/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('proximoUsuario');
      expect(response.body).toHaveProperty('saldoPorUsuario');
      expect(response.body).toHaveProperty('importeEstimado');
      expect(response.body.importeEstimado).toBe(60); // (90 + 30) / 2
    });

    it('debería rechazar petición sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/repostajes/calcularProximoRepostaje/${vehiculoId}`);

      expect(response.status).toBe(401);
    });
  });
});