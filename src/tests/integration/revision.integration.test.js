import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupDatabase, cleanDatabase, closeDatabase } from '../seeders/testSetup.js';
import revisionRoutes from '../../routes/revisionRoutes.js';
import usuarioRoutes from '../../routes/usuarioRoutes.js';
import vehiculoRoutes from '../../routes/vehiculoRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/revisiones', revisionRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/vehiculos', vehiculoRoutes);

describe('Revision - Tests de Integración', () => {
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

      console.log('Login response:', loginResponse.body); // DEBUG

    authToken = loginResponse.body.token;
    userId = loginResponse.body.userId;

    console.log('Auth token:', authToken); // DEBUG
  console.log('User ID:', userId); // DEBUG

    // Crear vehículo de prueba y asociarlo al usuario
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
      
 console.log('Vehiculo response:', vehiculoResponse.body); // DEBUG

    vehiculoId = vehiculoResponse.body.vehiculo.id;

    console.log('Vehiculo ID:', vehiculoId); // DEBUG
  });

  describe('POST /api/revisiones/registrar', () => {
    const revisionValida = {
      tipo: 'Aceite',
      fecha: '2025-10-28',
      kilometraje: 15000,
      observaciones: 'Cambio de aceite y filtro',
      proximaRevision: '2026-04-28',
      taller: 'Taller Central'
    };



    it('debería registrar una revisión correctamente', async () => {

      console.log('=== ANTES DEL REQUEST ===');
      console.log('userId:', userId);
      console.log('vehiculoId:', vehiculoId);
      console.log('revisionValida:', revisionValida);
      
      const datosAEnviar = { usuarioId: userId, vehiculoId, ...revisionValida };
      console.log('Datos finales a enviar:', datosAEnviar);

      const response = await request(app)
        .post('/api/revisiones/registrar')
        .set('Authorization', `Bearer ${authToken}`)
        .send(datosAEnviar);

        console.log('Response body:', response.body); // Añade esto
        console.log('Response status:', response.status); // Y esto

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('revision');
      expect(response.body.revision).toHaveProperty('tipo', 'Aceite');
      expect(response.body.revision).toHaveProperty('kilometraje', 15000);
    });

    it('debería fallar si el usuario no existe', async () => {
      const response = await request(app)
        .post('/api/revisiones/registrar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ usuarioId: 9999, vehiculoId, ...revisionValida });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'El usuario no existe');
    });

    it('debería fallar si el vehículo no existe', async () => {
      const response = await request(app)
        .post('/api/revisiones/registrar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ usuarioId: userId, vehiculoId: 9999, ...revisionValida });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'El vehículo no existe');
    });
  });

  describe('GET /api/revisiones/obtenerRevisiones/:vehiculoId', () => {
    beforeEach(async () => {


      // Crear algunas revisiones de prueba
      await request(app)
        .post('/api/revisiones/registrar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ usuarioId: userId, vehiculoId, tipo: 'Aceite', fecha: '2025-10-28', kilometraje: 15000, observaciones: 'Cambio aceite' });

      await request(app)
        .post('/api/revisiones/registrar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ usuarioId: userId, vehiculoId, tipo: 'Frenos', fecha: '2025-08-28', kilometraje: 14000, observaciones: 'Cambio pastillas' });
    });

    it('debería devolver todas las revisiones de un vehículo', async () => {
      const response = await request(app)
        .get(`/api/revisiones/obtenerRevisiones/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.revisiones).toHaveLength(2);
      expect(response.body.revisiones[0]).toHaveProperty('usuario', 'Usuario Test');
    });

    it('debería filtrar revisiones por tipo', async () => {
      const response = await request(app)
        .get(`/api/revisiones/obtenerRevisiones/${vehiculoId}?tipo=Aceite`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.revisiones).toHaveLength(1);
      expect(response.body.revisiones[0]).toHaveProperty('tipo', 'Aceite');
    });

    it('debería devolver array vacío si no hay revisiones de ese tipo', async () => {
      const response = await request(app)
        .get(`/api/revisiones/obtenerRevisiones/${vehiculoId}?tipo=Motor`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.revisiones).toHaveLength(0);
    });

    it('debería rechazar petición sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/revisiones/obtenerRevisiones/${vehiculoId}`);

      expect(response.status).toBe(401);
    });
  });
});
