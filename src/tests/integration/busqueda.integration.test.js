import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupDatabase, cleanDatabase, closeDatabase } from '../seeders/testSetup.js';
import busquedaRoutes from '../../routes/busquedaRoutes.js';
import usuarioRoutes from '../../routes/usuarioRoutes.js';
import vehiculoRoutes from '../../routes/vehiculoRoutes.js';
import viajeRoutes from '../../routes/viajeRoutes.js';
import reservaRoutes from '../../routes/reservaRoutes.js';
import revisionRoutes from '../../routes/revisionRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/busqueda', busquedaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/viajes', viajeRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/revisiones', revisionRoutes);

describe('Búsqueda - Tests de Integración', () => {
  let authToken;
  let userId;
  let vehiculoId;
  let authToken2;
  let userId2;

  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Crear primer usuario de prueba
    await request(app)
      .post('/api/usuarios/sign-up')
      .send({
        nombre: 'Usuario Test',
        email: 'test@example.com',
        contraseña: 'password123',
        fecha_nacimiento: '2000-01-01'
      });

    // Autenticar primer usuario
    const loginResponse = await request(app)
      .post('/api/usuarios/sign-in')
      .send({
        email: 'test@example.com',
        contraseña: 'password123'
      });

    authToken = loginResponse.body.token;
    userId = loginResponse.body.userId;

    // Crear segundo usuario de prueba
    await request(app)
      .post('/api/usuarios/sign-up')
      .send({
        nombre: 'Usuario Test 2',
        email: 'test2@example.com',
        contraseña: 'password123',
        fecha_nacimiento: '2000-01-01'
      });

    // Autenticar segundo usuario
    const loginResponse2 = await request(app)
      .post('/api/usuarios/sign-in')
      .send({
        email: 'test2@example.com',
        contraseña: 'password123'
      });

    authToken2 = loginResponse2.body.token;
    userId2 = loginResponse2.body.userId;

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

  describe('GET /api/busqueda/global/:vehiculoId', () => {
    beforeEach(async () => {
      // Crear viajes de prueba
      await request(app)
        .post('/api/viajes/crearViaje')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          nombre: 'Viaje a Madrid',
          descripcion: 'Viaje de negocios',
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
          nombre: 'Viaje a Barcelona',
          descripcion: 'Viaje de vacaciones',
          fechaHoraInicio: '2025-10-29T08:00:00.000Z',
          fechaHoraFin: '2025-10-29T18:00:00.000Z',
          kmRealizados: 600,
          consumoCombustible: 60,
          ubicacionFinal: { latitud: 41.3851, longitud: 2.1734 }
        });

      // Crear reservas de prueba
      await request(app)
        .post('/api/reservas/crearReserva')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          fechaInicio: '2025-11-01T08:00:00.000Z',
          fechaFin: '2025-11-01T18:00:00.000Z',
          motivo: 'Reunión importante'
        });

      // Crear revisiones de prueba
      await request(app)
        .post('/api/revisiones/crearRevision')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          vehiculoId: vehiculoId,
          fecha: '2025-10-15T10:00:00.000Z',
          tipo: 'Aceite',
          taller: 'Taller Madrid Centro',
          kilometraje: 15000,
          observaciones: 'Cambio de aceite y filtros',
          proximaRevision: '2026-04-15T10:00:00.000Z'
        });
    });

    it('debería buscar correctamente en viajes', async () => {
      const response = await request(app)
        .get(`/api/busqueda/global/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: 'Madrid' });
    
        console.log('Response status:', response.status);
        console.log('Response body:', response.body);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('viajes');
      expect(response.body.viajes.length).toBeGreaterThan(0);
      expect(response.body.viajes[0]).toHaveProperty('nombre');
    });

    it('debería buscar en múltiples entidades simultáneamente', async () => {
      const response = await request(app)
        .get(`/api/busqueda/global/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: 'Madrid' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('viajes');
      expect(response.body).toHaveProperty('reservas');
      expect(response.body).toHaveProperty('revisiones');
      
      // Debería encontrar resultados en viajes y revisiones
      const totalResultados = 
        response.body.viajes.length + 
        response.body.reservas.length + 
        response.body.revisiones.length;
      
      expect(totalResultados).toBeGreaterThan(0);
    });

    it('debería devolver arrays vacíos cuando no hay coincidencias', async () => {
      const response = await request(app)
        .get(`/api/busqueda/global/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: 'NoExiste123XYZ' });

      expect(response.status).toBe(200);
      expect(response.body.viajes).toHaveLength(0);
      expect(response.body.reservas).toHaveLength(0);
      expect(response.body.revisiones).toHaveLength(0);
    });

    it('debería rechazar búsqueda sin query', async () => {
      const response = await request(app)
        .get(`/api/busqueda/global/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', "El parámetro 'query' es requerido");
    });

    it('debería rechazar búsqueda con query vacío', async () => {
      const response = await request(app)
        .get(`/api/busqueda/global/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: '   ' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', "El parámetro 'query' es requerido");
    });

    it('debería rechazar búsqueda sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/busqueda/global/${vehiculoId}`)
        .query({ query: 'Madrid' });

      expect(response.status).toBe(401);
    });

    it('debería rechazar búsqueda en vehículo que no pertenece al usuario', async () => {
      const response = await request(app)
        .get(`/api/busqueda/global/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .query({ query: 'Madrid' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });

    it('debería rechazar búsqueda en vehículo inexistente', async () => {
      const response = await request(app)
        .get(`/api/busqueda/global/99999`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: 'Madrid' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });

    it('debería buscar sin distinguir mayúsculas/minúsculas', async () => {
      const response1 = await request(app)
        .get(`/api/busqueda/global/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: 'madrid' });

      const response2 = await request(app)
        .get(`/api/busqueda/global/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: 'MADRID' });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.viajes.length).toBe(response2.body.viajes.length);
    });

    it('debería buscar coincidencias parciales', async () => {
      const response = await request(app)
        .get(`/api/busqueda/global/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: 'neg' }); // Parte de "negocios"

      expect(response.status).toBe(200);
      expect(response.body.viajes.length).toBeGreaterThan(0);
    });

    it('debería limitar resultados a 10 por categoría', async () => {
      // Crear más de 10 viajes con la misma palabra clave
      const promises = [];
      for (let i = 0; i < 12; i++) {
        promises.push(
          request(app)
            .post('/api/viajes/crearViaje')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              usuarioId: userId,
              vehiculoId: vehiculoId,
              nombre: `Viaje Test ${i}`,
              descripcion: 'Descripción de prueba',
              fechaHoraInicio: `2025-11-${String(i + 1).padStart(2, '0')}T08:00:00.000Z`,
              fechaHoraFin: `2025-11-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`,
              kmRealizados: 50,
              consumoCombustible: 5,
              ubicacionFinal: { latitud: 40.4168, longitud: -3.7038 }
            })
        );
      }
      await Promise.all(promises);

      const response = await request(app)
        .get(`/api/busqueda/global/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ query: 'Test' });

      expect(response.status).toBe(200);
      expect(response.body.viajes.length).toBeLessThanOrEqual(10);
    });
  });
});