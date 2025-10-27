import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupDatabase, closeDatabase, sequelize } from '../seeders/testSetup.js';
import usuarioRoutes from '../../routes/usuarioRoutes.js';
import vehiculoRoutes from '../../routes/vehiculoRoutes.js';

// Crear app de Express para tests
const app = express();
app.use(express.json());
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/vehiculos', vehiculoRoutes);

describe('Vehiculo - Tests de Integración', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach(async () => {
    try {
      await sequelize.sync({ force: true });
    } catch (error) {
      console.error('Error limpiando:', error.message);
    }
  });

  // Helper para crear y autenticar usuario
  const crearYAutenticarUsuario = async (email = 'test@example.com', password = 'password123') => {
    await request(app)
      .post('/api/usuarios/sign-up')
      .send({
        nombre: 'Usuario Test',
        email,
        contraseña: password,
        fecha_nacimiento: '2000-01-01'
      });

    const loginResponse = await request(app)
      .post('/api/usuarios/sign-in')
      .send({
        email,
        contraseña: password
      });

    return {
      token: loginResponse.body.token,
      userId: loginResponse.body.userId
    };
  };

  describe('POST /api/vehiculos/registrar', () => {
    it('debería registrar un vehículo exitosamente', async () => {
      const { token, userId } = await crearYAutenticarUsuario();

      const response = await request(app)
        .post('/api/vehiculos/registrar')
        .set('Authorization', `Bearer ${token}`)
        .send({
          usuarioId: userId,
          nombre: 'Mi Tesla',
          matricula: '1234ABC',
          modelo: 'Model S',
          fabricante: 'Tesla',
          antiguedad: 2,
          tipo_combustible: 'Eléctrico',
          litros_combustible: 0,
          consumo_medio: 0,
          ubicacion_actual: { lat: 40.4168, lng: -3.7038 },
          estado: 'Activo',
          tipo: 'Coche'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Vehículo registrado exitosamente.');
      expect(response.body.vehiculo).toHaveProperty('matricula', '1234ABC');
    });

    it('debería rechazar si falta token de autenticación', async () => {
      const response = await request(app)
        .post('/api/vehiculos/registrar')
        .send({
          usuarioId: 1,
          nombre: 'Mi Tesla',
          matricula: '1234ABC',
          modelo: 'Model S',
          fabricante: 'Tesla',
          antiguedad: 2,
          tipo_combustible: 'Eléctrico',
          consumo_medio: 0
        });

      expect(response.status).toBe(401);
    });

    it('debería rechazar si faltan campos obligatorios', async () => {
      const { token, userId } = await crearYAutenticarUsuario();

      const response = await request(app)
        .post('/api/vehiculos/registrar')
        .set('Authorization', `Bearer ${token}`)
        .send({
          usuarioId: userId,
          nombre: 'Mi Tesla'
          // Faltan campos obligatorios
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Faltan campos obligatorios.');
    });

    it('debería rechazar matrícula duplicada', async () => {
      const { token, userId } = await crearYAutenticarUsuario();

      const vehiculoData = {
        usuarioId: userId,
        nombre: 'Mi Tesla',
        matricula: '1234ABC',
        modelo: 'Model S',
        fabricante: 'Tesla',
        antiguedad: 2,
        tipo_combustible: 'Eléctrico',
        litros_combustible: 0,
        consumo_medio: 0
      };

      // Crear primer vehículo
      await request(app)
        .post('/api/vehiculos/registrar')
        .set('Authorization', `Bearer ${token}`)
        .send(vehiculoData);

      // Intentar crear vehículo con misma matrícula
      const response = await request(app)
        .post('/api/vehiculos/registrar')
        .set('Authorization', `Bearer ${token}`)
        .send(vehiculoData);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'La matrícula ya está registrada.');
    });

    it('debería rechazar tipo de combustible no válido', async () => {
      const { token, userId } = await crearYAutenticarUsuario();

      const response = await request(app)
        .post('/api/vehiculos/registrar')
        .set('Authorization', `Bearer ${token}`)
        .send({
          usuarioId: userId,
          nombre: 'Mi Tesla',
          matricula: '1234ABC',
          modelo: 'Model S',
          fabricante: 'Tesla',
          antiguedad: 2,
          tipo_combustible: 'Nuclear',
          consumo_medio: 0
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Tipo de combustible no válido.');
    });
  });

  describe('GET /api/vehiculos/obtenerVehiculos/:usuarioId', () => {
    it('debería obtener los vehículos de un usuario', async () => {
      const { token, userId } = await crearYAutenticarUsuario();

      // Crear un vehículo
      await request(app)
        .post('/api/vehiculos/registrar')
        .set('Authorization', `Bearer ${token}`)
        .send({
          usuarioId: userId,
          nombre: 'Mi Tesla',
          matricula: '1234ABC',
          modelo: 'Model S',
          fabricante: 'Tesla',
          antiguedad: 2,
          tipo_combustible: 'Eléctrico',
          litros_combustible: 0,
          consumo_medio: 0
        });

      const response = await request(app)
        .get(`/api/vehiculos/obtenerVehiculos/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('vehiculos');
      expect(response.body.vehiculos).toHaveLength(1);
      expect(response.body.vehiculos[0]).toHaveProperty('nombre', 'Mi Tesla');
    });

    it('debería rechazar si el usuario no existe', async () => {
      const { token } = await crearYAutenticarUsuario();

      const response = await request(app)
        .get('/api/vehiculos/obtenerVehiculos/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Usuario no encontrado.');
    });
  });

  describe('GET /api/vehiculos/obtenerUbicacion/:vehiculoId', () => {
    it('debería obtener la ubicación de un vehículo', async () => {
      const { token, userId } = await crearYAutenticarUsuario();

      const ubicacion = { lat: 40.4168, lng: -3.7038 };

      // Crear vehículo
      const vehiculoResponse = await request(app)
        .post('/api/vehiculos/registrar')
        .set('Authorization', `Bearer ${token}`)
        .send({
          usuarioId: userId,
          nombre: 'Mi Tesla',
          matricula: '1234ABC',
          modelo: 'Model S',
          fabricante: 'Tesla',
          antiguedad: 2,
          tipo_combustible: 'Eléctrico',
          litros_combustible: 0,
          consumo_medio: 0,
          ubicacion_actual: ubicacion
        });

      const vehiculoId = vehiculoResponse.body.vehiculo.id;

      const response = await request(app)
        .get(`/api/vehiculos/obtenerUbicacion/${vehiculoId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ubicacion_actual');
      expect(response.body.ubicacion_actual).toEqual(ubicacion);
    });

    it('debería rechazar si el usuario no está vinculado al vehículo', async () => {
      const { token: token1, userId: userId1 } = await crearYAutenticarUsuario('user1@example.com');
      const { token: token2 } = await crearYAutenticarUsuario('user2@example.com', 'password456');

      // Usuario 1 crea un vehículo
      const vehiculoResponse = await request(app)
        .post('/api/vehiculos/registrar')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          usuarioId: userId1,
          nombre: 'Mi Tesla',
          matricula: '1234ABC',
          modelo: 'Model S',
          fabricante: 'Tesla',
          antiguedad: 2,
          tipo_combustible: 'Eléctrico',
          litros_combustible: 0,
          consumo_medio: 0
        });

      const vehiculoId = vehiculoResponse.body.vehiculo.id;

      // Usuario 2 intenta ver la ubicación
      const response = await request(app)
        .get(`/api/vehiculos/obtenerUbicacion/${vehiculoId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'No tienes permisos para ver la ubicación de este vehículo.');
    });
  });

  describe('PUT /api/vehiculos/actualizarUbicacion/:vehiculoId', () => {
    it('debería actualizar la ubicación de un vehículo', async () => {
      const { token, userId } = await crearYAutenticarUsuario();

      // Crear vehículo
      const vehiculoResponse = await request(app)
        .post('/api/vehiculos/registrar')
        .set('Authorization', `Bearer ${token}`)
        .send({
          usuarioId: userId,
          nombre: 'Mi Tesla',
          matricula: '1234ABC',
          modelo: 'Model S',
          fabricante: 'Tesla',
          antiguedad: 2,
          tipo_combustible: 'Eléctrico',
          litros_combustible: 0,
          consumo_medio: 0,
          ubicacion_actual: { lat: 40.4168, lng: -3.7038 }
        });

      const vehiculoId = vehiculoResponse.body.vehiculo.id;
      const nuevaUbicacion = { lat: 41.3851, lng: 2.1734 };

      const response = await request(app)
        .put(`/api/vehiculos/actualizarUbicacion/${vehiculoId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ubicacion_actual: nuevaUbicacion });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Ubicación actualizada correctamente.');
      expect(response.body.ubicacion_actual).toEqual(nuevaUbicacion);
    });

    it('debería rechazar si el usuario no está vinculado al vehículo', async () => {
      const { token: token1, userId: userId1 } = await crearYAutenticarUsuario('user1@example.com');
      const { token: token2 } = await crearYAutenticarUsuario('user2@example.com', 'password456');

      // Usuario 1 crea un vehículo
      const vehiculoResponse = await request(app)
        .post('/api/vehiculos/registrar')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          usuarioId: userId1,
          nombre: 'Mi Tesla',
          matricula: '1234ABC',
          modelo: 'Model S',
          fabricante: 'Tesla',
          antiguedad: 2,
          tipo_combustible: 'Eléctrico',
          litros_combustible: 0,
          consumo_medio: 0
        });

      const vehiculoId = vehiculoResponse.body.vehiculo.id;

      // Usuario 2 intenta actualizar la ubicación
      const response = await request(app)
        .put(`/api/vehiculos/actualizarUbicacion/${vehiculoId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ ubicacion_actual: { lat: 41.3851, lng: 2.1734 } });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'No tienes permisos para actualizar la ubicación de este vehículo.');
    });
  });
});