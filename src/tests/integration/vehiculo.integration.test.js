import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupDatabase, closeDatabase, sequelize, cleanDatabase } from '../seeders/testSetup.js';
import usuarioRoutes from '../../routes/usuarioRoutes.js';
import vehiculoRoutes from '../../routes/vehiculoRoutes.js';
import invitacionRoutes from '../../routes/invitacionRoutes.js';

// Crear app de Express para tests
const app = express();
app.use(express.json());
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/invitaciones', invitacionRoutes);

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
          matricula: '1234 BBC',
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
      expect(response.body.vehiculo).toHaveProperty('matricula', '1234 BBC');
    });

    it('debería rechazar si falta token de autenticación', async () => {
      const response = await request(app)
        .post('/api/vehiculos/registrar')
        .send({
          usuarioId: 1,
          nombre: 'Mi Tesla',
          matricula: '123 BBC',
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
        matricula: '1234 BBC',
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
          matricula: '1234 BBC',
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
          matricula: '1234 BBC',
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
          matricula: '1234 BBC',
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
          matricula: '1234 BBC',
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
          matricula: '1234 BBC',
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
          matricula: '1234 BBC',
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

  describe('Vehiculo - Endpoints especiales', () => {
    let authTokenPropietario, userIdPropietario, vehiculoId, authTokenInvitado, userIdInvitado;

    beforeAll(async () => {
      await setupDatabase();
    });

    /*
    afterAll(async () => {
      await closeDatabase();
    });
    */

    beforeEach(async () => {
      await cleanDatabase();

      // Crear propietario
      const signup1 = await request(app)
        .post('/api/usuarios/sign-up')
        .send({
          nombre: 'Propietario',
          email: 'propietario@example.com',
          contraseña: 'password123',
          fecha_nacimiento: '2000-01-01'
        });
      const login1 = await request(app)
        .post('/api/usuarios/sign-in')
        .send({
          email: 'propietario@example.com',
          contraseña: 'password123'
        });
      authTokenPropietario = login1.body.token;
      userIdPropietario = login1.body.userId;

      // Crear invitado
      const signup2 = await request(app)
        .post('/api/usuarios/sign-up')
        .send({
          nombre: 'Invitado',
          email: 'invitado@example.com',
          contraseña: 'password123',
          fecha_nacimiento: '2000-01-01'
        });
      const login2 = await request(app)
        .post('/api/usuarios/sign-in')
        .send({
          email: 'invitado@example.com',
          contraseña: 'password123'
        });
      authTokenInvitado = login2.body.token;
      userIdInvitado = login2.body.userId;

      // Crear vehículo como propietario
      const vehiculoResponse = await request(app)
        .post('/api/vehiculos/registrar')
        .set('Authorization', `Bearer ${authTokenPropietario}`)
        .send({
          usuarioId: userIdPropietario,
          fabricante: 'Toyota',
          modelo: 'Corolla',
          nombre: 'Mi Toyota',
          antiguedad: 2020,
          matricula: 'TEST1234',
          tipo_combustible: 'Gasolina',
          consumo_medio: 6.5,
          litros_combustible: 50.5,
          ubicacion_actual: { latitud: 40.4168, longitud: -3.7038 },
          estado: 'Activo',
          tipo: 'Coche'
        });
      vehiculoId = vehiculoResponse.body.vehiculo.id;

      // --- INVITACIÓN Y ACEPTACIÓN MANUAL ---
      // 1. El propietario genera la invitación
      const invitacionResponse = await request(app)
        .post(`/api/invitaciones/generarInvitacion/${vehiculoId}`)
        .set('Authorization', `Bearer ${authTokenPropietario}`)
        .send({
          usuarioId: userIdPropietario,
          emailInvitado: 'invitado@example.com'
        });

      const codigo = invitacionResponse.body.codigo;

      // 2. El invitado acepta la invitación
      await request(app)
        .post('/api/invitaciones/aceptarInvitacion')
        .set('Authorization', `Bearer ${authTokenInvitado}`)
        .send({ codigo });
    });

    it('El propietario puede eliminar el vehículo completamente', async () => {
      const response = await request(app)
        .delete(`/api/vehiculos/eliminar/${vehiculoId}`)
        .set('Authorization', `Bearer ${authTokenPropietario}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Vehículo eliminado correctamente');
    });

    it('Un usuario no propietario elimina solo su relación con el vehículo', async () => {
      // Primero, el invitado debe estar vinculado al vehículo
      // (esto depende de tu lógica de asociación, aquí se asume que ya está hecho en el beforeEach)
      const response = await request(app)
        .delete(`/api/vehiculos/eliminar/${vehiculoId}`)
        .set('Authorization', `Bearer ${authTokenInvitado}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Relación con el vehículo eliminada correctamente');
    });

    it('Solo el propietario puede editar el vehículo', async () => {
      const response = await request(app)
        .put(`/api/vehiculos/editar/${vehiculoId}`)
        .set('Authorization', `Bearer ${authTokenPropietario}`)
        .send({ nombre: 'Nuevo Nombre' });

      expect(response.status).toBe(200);
      expect(response.body.vehiculo.nombre).toBe('Nuevo Nombre');
    });

    it('Un usuario no propietario NO puede editar el vehículo', async () => {
      const response = await request(app)
        .put(`/api/vehiculos/editar/${vehiculoId}`)
        .set('Authorization', `Bearer ${authTokenInvitado}`)
        .send({ nombre: 'Hackeo' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Solo el propietario');
    });

    it('El propietario puede eliminar a un usuario del vehículo', async () => {
      const response = await request(app)
        .post(`/api/vehiculos/eliminarUsuario/${vehiculoId}`)
        .set('Authorization', `Bearer ${authTokenPropietario}`)
        .send({ usuarioNombre: 'Invitado' });

      console.log('Respuesta de eliminar vehículo por invitado:');
      console.log(response.body);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Usuario eliminado del vehículo');
    });

    it('Un usuario no propietario NO puede eliminar a otro usuario', async () => {
      const response = await request(app)
        .post(`/api/vehiculos/eliminarUsuario/${vehiculoId}`)
        .set('Authorization', `Bearer ${authTokenInvitado}`)
        .send({ usuarioNombre: 'Propietario' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Solo el propietario');
    });
  });
});