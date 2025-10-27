import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupDatabase, cleanDatabase, closeDatabase, sequelize } from '../seeders/testSetup.js';
import usuarioRoutes from '../../routes/usuarioRoutes.js';

// Crear app de Express para tests
const app = express();
app.use(express.json());
app.use('/api/usuarios', usuarioRoutes);

describe('Usuario - Tests de Integración', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Configurar base de datos antes de todos los tests
    await setupDatabase();
  });

  afterAll(async () => {
    // Cerrar conexión después de todos los tests
    await closeDatabase();
  });

  beforeEach(async () => {
    // Limpiar solo la tabla de usuarios antes de cada test
    await cleanDatabase();
  });

  describe('POST /api/usuarios/sign-up', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      const response = await request(app)
        .post('/api/usuarios/sign-up')
        .send({
          nombre: 'Usuario Test',
          email: 'test@example.com',
          contraseña: 'password123',
          fecha_nacimiento: '2000-01-01'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Usuario registrado exitosamente.');
      expect(response.body.usuario).toHaveProperty('email', 'test@example.com');
    });

    it('debería rechazar email duplicado', async () => {
      // Crear primer usuario
      await request(app)
        .post('/api/usuarios/sign-up')
        .send({
          nombre: 'Usuario Test',
          email: 'test@example.com',
          contraseña: 'password123',
          fecha_nacimiento: '2000-01-01'
        });

      // Intentar crear usuario con mismo email
      const response = await request(app)
        .post('/api/usuarios/sign-up')
        .send({
          nombre: 'Usuario Test 2',
          email: 'test@example.com',
          contraseña: 'password456',
          fecha_nacimiento: '2001-01-01'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'El email ya está registrado.');
    });

    it('debería rechazar email con formato inválido', async () => {
      const response = await request(app)
        .post('/api/usuarios/sign-up')
        .send({
          nombre: 'Usuario Test',
          email: 'invalid-email',
          contraseña: 'password123',
          fecha_nacimiento: '2000-01-01'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'El formato del email no es válido.');
    });

    it('debería rechazar usuario menor de 16 años', async () => {
      const today = new Date();
      const date = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());

      const response = await request(app)
        .post('/api/usuarios/sign-up')
        .send({
          nombre: 'Usuario Test',
          email: 'test@example.com',
          contraseña: 'password123',
          fecha_nacimiento: date.toISOString().split('T')[0]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('edad mínima');
    });
  });

  describe('POST /api/usuarios/sign-in', () => {
    beforeEach(async () => {
      // Crear usuario para pruebas de login
      await request(app)
        .post('/api/usuarios/sign-up')
        .send({
          nombre: 'Usuario Test',
          email: 'test@example.com',
          contraseña: 'password123',
          fecha_nacimiento: '2000-01-01'
        });
    });

    it('debería autenticar un usuario correctamente', async () => {
      const response = await request(app)
        .post('/api/usuarios/sign-in')
        .send({
          email: 'test@example.com',
          contraseña: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Inicio de sesión exitoso.');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('userId');

      authToken = response.body.token;
      userId = response.body.userId;
    });

    it('debería rechazar credenciales incorrectas', async () => {
      const response = await request(app)
        .post('/api/usuarios/sign-in')
        .send({
          email: 'test@example.com',
          contraseña: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Contraseña incorrecta.');
    });

    it('debería rechazar usuario no existente', async () => {
      const response = await request(app)
        .post('/api/usuarios/sign-in')
        .send({
          email: 'noexiste@example.com',
          contraseña: 'password123'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Usuario no encontrado.');
    });
  });

  describe('GET /api/usuarios/obtenerNombreUsuario/:id', () => {
    beforeEach(async () => {
      // Registrar y autenticar usuario
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
    });

    it('debería obtener el nombre del usuario autenticado', async () => {
      const response = await request(app)
        .get(`/api/usuarios/obtenerNombreUsuario/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('nombre', 'Usuario Test');
      expect(response.body).toHaveProperty('id', userId);
    });

    it('debería rechazar petición sin token', async () => {
      const response = await request(app)
        .get(`/api/usuarios/obtenerNombreUsuario/${userId}`);

      expect(response.status).toBe(401);
    });

    it('debería rechazar acceso a usuario no existente', async () => {
      const response = await request(app)
        .get(`/api/usuarios/obtenerNombreUsuario/999`)
        .set('Authorization', `Bearer ${authToken}`);

      // Cuando el usuario no existe, devuelve 404
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Usuario no encontrado.');
    });

    it('debería rechazar acceso a otro usuario existente', async () => {
      // Crear un segundo usuario
      await request(app)
        .post('/api/usuarios/sign-up')
        .send({
          nombre: 'Otro Usuario',
          email: 'otro@example.com',
          contraseña: 'password456',
          fecha_nacimiento: '1995-01-01'
        });

      // Obtener el ID del segundo usuario
      const loginResponse2 = await request(app)
        .post('/api/usuarios/sign-in')
        .send({
          email: 'otro@example.com',
          contraseña: 'password456'
        });

      const otherUserId = loginResponse2.body.userId;

      // Intentar acceder al segundo usuario con el token del primer usuario
      const response = await request(app)
        .get(`/api/usuarios/obtenerNombreUsuario/${otherUserId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'No tienes permiso para acceder a esta información.');
    });
  });
});