import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupDatabase, closeDatabase, sequelize } from '../seeders/testSetup.js';
import usuarioRoutes from '../../routes/usuarioRoutes.js';
import vehiculoRoutes from '../../routes/vehiculoRoutes.js';
import invitacionRoutes from '../../routes/invitacionRoutes.js';

// Crear app de Express para tests
const app = express();
app.use(express.json());
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/invitaciones', invitacionRoutes);

describe('Invitacion - Tests de Integración', () => {
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
  const crearYAutenticarUsuario = async (email, password = 'password123') => {
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

  // Helper para crear un vehículo
  const crearVehiculo = async (token, userId, matricula = '1234ABC') => {
    const response = await request(app)
      .post('/api/vehiculos/registrar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        usuarioId: userId,
        nombre: 'Mi Tesla',
        matricula,
        modelo: 'Model S',
        fabricante: 'Tesla',
        antiguedad: 2,
        tipo_combustible: 'Eléctrico',
        litros_combustible: 0,
        consumo_medio: 0
      });

    return response.body.vehiculo;
  };

  describe('POST /api/invitaciones/generarInvitacion/:vehiculoId', () => {
    it('debería generar una invitación exitosamente', async () => {
      const { token: token1, userId: userId1 } = await crearYAutenticarUsuario('owner@example.com');
      const { userId: userId2 } = await crearYAutenticarUsuario('invitado@example.com');
      
      const vehiculo = await crearVehiculo(token1, userId1);

      const response = await request(app)
        .post(`/api/invitaciones/generarInvitacion/${vehiculo.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          usuarioId: userId1,
          emailInvitado: 'invitado@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Invitación generada exitosamente');
      expect(response.body).toHaveProperty('codigo');
      expect(response.body.codigo).toMatch(/^JOIN-/);
      expect(response.body.vehiculo).toHaveProperty('id', vehiculo.id);
    });

    it('debería rechazar si falta token de autenticación', async () => {
      const response = await request(app)
        .post('/api/invitaciones/generarInvitacion/1')
        .send({
          usuarioId: 1,
          emailInvitado: 'invitado@example.com'
        });

      expect(response.status).toBe(401);
    });

    it('debería rechazar si el vehículo no existe', async () => {
      const { token, userId } = await crearYAutenticarUsuario('owner@example.com');

      const response = await request(app)
        .post('/api/invitaciones/generarInvitacion/999')
        .set('Authorization', `Bearer ${token}`)
        .send({
          usuarioId: userId,
          emailInvitado: 'invitado@example.com'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Vehículo no encontrado.');
    });

    it('debería rechazar si el usuario invitado no existe', async () => {
      const { token, userId } = await crearYAutenticarUsuario('owner@example.com');
      const vehiculo = await crearVehiculo(token, userId);

      const response = await request(app)
        .post(`/api/invitaciones/generarInvitacion/${vehiculo.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          usuarioId: userId,
          emailInvitado: 'noexiste@example.com'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Usuario invitado no encontrado.');
    });

    it('debería rechazar si el usuario intenta invitarse a sí mismo', async () => {
      const { token, userId } = await crearYAutenticarUsuario('owner@example.com');
      const vehiculo = await crearVehiculo(token, userId);

      const response = await request(app)
        .post(`/api/invitaciones/generarInvitacion/${vehiculo.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          usuarioId: userId,
          emailInvitado: 'owner@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'No puedes invitarte a ti mismo.');
    });

    it('debería rechazar si ya existe una invitación activa', async () => {
      const { token, userId } = await crearYAutenticarUsuario('owner@example.com');
      await crearYAutenticarUsuario('invitado@example.com');
      const vehiculo = await crearVehiculo(token, userId);

      // Crear primera invitación
      await request(app)
        .post(`/api/invitaciones/generarInvitacion/${vehiculo.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          usuarioId: userId,
          emailInvitado: 'invitado@example.com'
        });

      // Intentar crear segunda invitación
      const response = await request(app)
        .post(`/api/invitaciones/generarInvitacion/${vehiculo.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          usuarioId: userId,
          emailInvitado: 'invitado@example.com'
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Ya existe una invitación activa para este usuario y vehículo.');
    });
  });

  describe('POST /api/invitaciones/aceptarInvitacion', () => {
    it('debería aceptar una invitación exitosamente', async () => {
      const { token: token1, userId: userId1 } = await crearYAutenticarUsuario('owner@example.com');
      const { token: token2 } = await crearYAutenticarUsuario('invitado@example.com');
      const vehiculo = await crearVehiculo(token1, userId1);

      // Generar invitación
      const invitacionResponse = await request(app)
        .post(`/api/invitaciones/generarInvitacion/${vehiculo.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          usuarioId: userId1,
          emailInvitado: 'invitado@example.com'
        });

      const codigo = invitacionResponse.body.codigo;

      // Aceptar invitación
      const response = await request(app)
        .post('/api/invitaciones/aceptarInvitacion')
        .set('Authorization', `Bearer ${token2}`)
        .send({ codigo });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Invitación aceptada correctamente. Ahora eres copropietario del vehículo.');
      expect(response.body.vehiculo).toHaveProperty('id', vehiculo.id);
    });

    it('debería rechazar si la invitación no existe', async () => {
      const { token } = await crearYAutenticarUsuario('user@example.com');

      const response = await request(app)
        .post('/api/invitaciones/aceptarInvitacion')
        .set('Authorization', `Bearer ${token}`)
        .send({ codigo: 'JOIN-INVALIDO' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Invitación no encontrada.');
    });

    it('debería rechazar si la invitación ya fue usada', async () => {
      const { token: token1, userId: userId1 } = await crearYAutenticarUsuario('owner@example.com');
      const { token: token2 } = await crearYAutenticarUsuario('invitado@example.com');
      const vehiculo = await crearVehiculo(token1, userId1);

      // Generar invitación
      const invitacionResponse = await request(app)
        .post(`/api/invitaciones/generarInvitacion/${vehiculo.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          usuarioId: userId1,
          emailInvitado: 'invitado@example.com'
        });

      const codigo = invitacionResponse.body.codigo;

      // Aceptar invitación primera vez
      await request(app)
        .post('/api/invitaciones/aceptarInvitacion')
        .set('Authorization', `Bearer ${token2}`)
        .send({ codigo });

      // Intentar aceptar de nuevo
      const response = await request(app)
        .post('/api/invitaciones/aceptarInvitacion')
        .set('Authorization', `Bearer ${token2}`)
        .send({ codigo });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'La invitación ya ha sido utilizada.');
    });
  });

  describe('POST /api/invitaciones/rechazarInvitacion', () => {
    it('debería rechazar una invitación exitosamente', async () => {
      const { token: token1, userId: userId1 } = await crearYAutenticarUsuario('owner@example.com');
      const { token: token2, userId: userId2 } = await crearYAutenticarUsuario('invitado@example.com');
      const vehiculo = await crearVehiculo(token1, userId1);

      // Generar invitación
      const invitacionResponse = await request(app)
        .post(`/api/invitaciones/generarInvitacion/${vehiculo.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          usuarioId: userId1,
          emailInvitado: 'invitado@example.com'
        });

      // Obtener invitaciones para conseguir el ID
      const invitacionesResponse = await request(app)
        .get(`/api/invitaciones/invitacionesRecibidas/${userId2}`)
        .set('Authorization', `Bearer ${token2}`);

      const invitacionId = invitacionesResponse.body.invitaciones[0].id;

      // Rechazar invitación
      const response = await request(app)
        .post('/api/invitaciones/rechazarInvitacion')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          invitacionId,
          usuarioId: userId2
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Invitación rechazada y eliminada correctamente.');
    });
  });

  describe('GET /api/invitaciones/invitacionesRecibidas/:usuarioId', () => {
    it('debería obtener las invitaciones recibidas', async () => {
      const { token: token1, userId: userId1 } = await crearYAutenticarUsuario('owner@example.com');
      const { token: token2, userId: userId2 } = await crearYAutenticarUsuario('invitado@example.com');
      const vehiculo = await crearVehiculo(token1, userId1);

      // Generar invitación
      await request(app)
        .post(`/api/invitaciones/generarInvitacion/${vehiculo.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          usuarioId: userId1,
          emailInvitado: 'invitado@example.com'
        });

      // Obtener invitaciones recibidas
      const response = await request(app)
        .get(`/api/invitaciones/invitacionesRecibidas/${userId2}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('invitaciones');
      expect(response.body.invitaciones).toHaveLength(1);
      expect(response.body.invitaciones[0].Vehiculo).toHaveProperty('matricula', '1234ABC');
    });

    it('debería rechazar si el usuario no existe', async () => {
      const { token } = await crearYAutenticarUsuario('user@example.com');

      const response = await request(app)
        .get('/api/invitaciones/invitacionesRecibidas/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Usuario no encontrado.');
    });
  });
});