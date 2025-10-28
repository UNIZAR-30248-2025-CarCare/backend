import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupDatabase, cleanDatabase, closeDatabase } from '../seeders/testSetup.js';
import viajeRoutes from '../../routes/viajeRoutes.js';
import usuarioRoutes from '../../routes/usuarioRoutes.js';
import vehiculoRoutes from '../../routes/vehiculoRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/viajes', viajeRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/vehiculos', vehiculoRoutes);

describe('Viaje - Tests de Integración', () => {
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

        console.log('Vehicle Response:', vehiculoResponse.error);
        console.log('Vehicle Response Status:', vehiculoResponse.status);

        vehiculoId = vehiculoResponse.body.vehiculo.id;
  });

  describe('POST /api/viajes/crearViaje', () => {
    const viajeValido = {
      nombre: 'Viaje a Madrid',
      descripcion: 'Viaje de trabajo',
      fechaHoraInicio: '2025-10-28T08:00:00.000Z',
      fechaHoraFin: '2025-10-28T14:00:00.000Z',
      kmRealizados: 350.5,
      consumoCombustible: 25.5,
      ubicacionFinal: { latitud: 40.4168, longitud: -3.7038 }
    };

    it('debería crear un viaje exitosamente', async () => {
      const response = await request(app)
        .post('/api/viajes/crearViaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          ...viajeValido
        });

    console.log(response.body);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('viaje');
      expect(response.body.viaje).toHaveProperty('nombre', 'Viaje a Madrid');
      expect(response.body.viaje).toHaveProperty('kmRealizados', 350.5);
    });

    it('debería rechazar viaje sin autenticación', async () => {
      const response = await request(app)
        .post('/api/viajes/crearViaje')
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          ...viajeValido
        });

      expect(response.status).toBe(401);
    });

    it('debería rechazar viaje con usuario inexistente', async () => {
      const response = await request(app)
        .post('/api/viajes/crearViaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: 9999,
          vehiculoId: vehiculoId,
          ...viajeValido
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'El usuario no existe');
    });

    it('debería rechazar viaje con vehículo inexistente', async () => {
      const response = await request(app)
        .post('/api/viajes/crearViaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: 9999,
          ...viajeValido
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'El vehículo no existe');
    });

    it('debería rechazar viaje con fecha de inicio mayor que fecha de fin', async () => {
      const response = await request(app)
        .post('/api/viajes/crearViaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          ...viajeValido,
          fechaHoraInicio: '2025-10-28T14:00:00.000Z',
          fechaHoraFin: '2025-10-28T08:00:00.000Z'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'La fecha de inicio no puede ser mayor que la de fin');
    });

    it('debería rechazar viaje con km realizados negativos', async () => {
      const response = await request(app)
        .post('/api/viajes/crearViaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          ...viajeValido,
          kmRealizados: -10
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('km realizados');
    });

    it('debería actualizar la ubicación del vehículo al crear viaje', async () => {
      const nuevaUbicacion = { latitud: 41.3851, longitud: 2.1734 }; // Barcelona

      await request(app)
        .post('/api/viajes/crearViaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          ...viajeValido,
          ubicacionFinal: nuevaUbicacion
        });

      // Verificar que la ubicación del vehículo se actualizó
      const vehiculoResponse = await request(app)
        .get(`/api/vehiculos/obtenerUbicacion/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(vehiculoResponse.body.ubicacion_actual).toEqual(nuevaUbicacion);
    });
  });

  describe('GET /api/viajes/obtenerViajes/:vehiculoId', () => {
    beforeEach(async () => {
      // Crear algunos viajes de prueba
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
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          nombre: 'Viaje 2',
          descripcion: 'Segundo viaje',
          fechaHoraInicio: '2025-10-29T08:00:00.000Z',
          fechaHoraFin: '2025-10-29T10:00:00.000Z',
          kmRealizados: 150,
          consumoCombustible: 15,
          ubicacionFinal: { latitud: 41.3851, longitud: 2.1734 }
        });
    });

    it('debería obtener todos los viajes de un vehículo', async () => {
      const response = await request(app)
        .get(`/api/viajes/obtenerViajes/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('viajes');
      expect(response.body.viajes).toHaveLength(2);
      expect(response.body.viajes[0]).toHaveProperty('usuario', 'Usuario Test');
      expect(response.body.viajes[0]).not.toHaveProperty('usuarioId');
    });

    it('debería devolver array vacío si el vehículo no tiene viajes', async () => {
      // Crear otro vehículo sin viajes
      const otroVehiculoResponse = await request(app)
        .post('/api/vehiculos/crearVehiculo')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          marca: 'Honda',
          modelo: 'Civic',
          anio: 2021,
          matricula: 'XYZ9876',
          tipo_combustible: 'Diesel',
          consumo_medio: 5.5,
          ubicacion_actual: { latitud: 40.4168, longitud: -3.7038 }
        });

      const response = await request(app)
        .get(`/api/viajes/obtenerViajes/${otroVehiculoResponse.body.vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.viajes).toHaveLength(0);
    });

    it('debería rechazar petición sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/viajes/obtenerViajes/${vehiculoId}`);

      expect(response.status).toBe(401);
    });
  });
});