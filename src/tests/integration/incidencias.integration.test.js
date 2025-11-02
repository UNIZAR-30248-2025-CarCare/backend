import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupDatabase, closeDatabase, sequelize } from '../seeders/testSetup.js';
import usuarioRoutes from '../../routes/usuarioRoutes.js';
import vehiculoRoutes from '../../routes/vehiculoRoutes.js';
import incidenciaRoutes from '../../routes/incidenciaRoutes.js';

// Crear app de Express para tests
const app = express();
app.use(express.json());
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/incidencias', incidenciaRoutes);

describe('Incidencia - Tests de Integración', () => {
  let authToken;
  let userId;
  let vehiculoId;

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

  // Helper para crear un vehículo
  const crearVehiculo = async (token, userId, matricula = '1234ABC') => {
    const response = await request(app)
      .post('/api/vehiculos/registrar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        usuarioId: userId,
        nombre: 'Mi Seat León',
        matricula,
        modelo: 'León',
        fabricante: 'Seat',
        antiguedad: 5,
        tipo_combustible: 'Diésel',
        litros_combustible: 45,
        consumo_medio: 5.2,
        ubicacion_actual: { lat: 41.6488, lng: -0.8891 },
        estado: 'Activo',
        tipo: 'Coche'
      });

    return response.body.vehiculo.id;
  };

  describe('POST /api/incidencias/crear', () => {
    it('debería crear una incidencia exitosamente', async () => {
      const { token, userId } = await crearYAutenticarUsuario();
      const vehiculoId = await crearVehiculo(token, userId);

      const response = await request(app)
        .post('/api/incidencias/crear')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Ruido extraño en el motor',
          descripcion: 'Al arrancar el coche se escucha un ruido metálico',
          compartirConGrupo: true
        });

      console.log("ERROR BODY:", response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Incidencia creada exitosamente.');
      expect(response.body.incidencia).toHaveProperty('titulo', 'Ruido extraño en el motor');
      expect(response.body.incidencia).toHaveProperty('tipo', 'Avería');
      expect(response.body.incidencia).toHaveProperty('prioridad', 'Alta');
      expect(response.body.incidencia).toHaveProperty('estado', 'Pendiente');
    });

    it('debería rechazar si falta token de autenticación', async () => {
      const response = await request(app)
        .post('/api/incidencias/crear')
        .send({
          vehiculoId: 1,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Test',
          descripcion: 'Test'
        });

      expect(response.status).toBe(401);
    });

    it('debería rechazar si faltan campos obligatorios', async () => {
      const { token, userId } = await crearYAutenticarUsuario();
      const vehiculoId = await crearVehiculo(token, userId);

      const response = await request(app)
        .post('/api/incidencias/crear')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehiculoId,
          tipo: 'Avería'
          // Faltan prioridad, titulo, descripcion
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Faltan campos obligatorios.');
    });

    it('debería rechazar tipo de incidencia no válido', async () => {
      const { token, userId } = await crearYAutenticarUsuario();
      const vehiculoId = await crearVehiculo(token, userId);

      const response = await request(app)
        .post('/api/incidencias/crear')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehiculoId,
          tipo: 'TipoInvalido',
          prioridad: 'Alta',
          titulo: 'Test',
          descripcion: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Tipo de incidencia no válido.');
    });

    it('debería rechazar prioridad no válida', async () => {
      const { token, userId } = await crearYAutenticarUsuario();
      const vehiculoId = await crearVehiculo(token, userId);

      const response = await request(app)
        .post('/api/incidencias/crear')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehiculoId,
          tipo: 'Avería',
          prioridad: 'PrioridadInvalida',
          titulo: 'Test',
          descripcion: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Prioridad no válida.');
    });

    it('debería rechazar si el usuario no tiene acceso al vehículo', async () => {
      const { token: token1, userId: userId1 } = await crearYAutenticarUsuario('user1@example.com');
      const { token: token2 } = await crearYAutenticarUsuario('user2@example.com', 'password456');
      
      const vehiculoId = await crearVehiculo(token1, userId1);

      // Usuario 2 intenta crear incidencia en vehículo de usuario 1
      const response = await request(app)
        .post('/api/incidencias/crear')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Test',
          descripcion: 'Test'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'No tienes permisos para crear incidencias en este vehículo.');
    });

    it('debería crear incidencia con compartirConGrupo en false', async () => {
      const { token, userId } = await crearYAutenticarUsuario();
      const vehiculoId = await crearVehiculo(token, userId);

      const response = await request(app)
        .post('/api/incidencias/crear')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehiculoId,
          tipo: 'Daño',
          prioridad: 'Baja',
          titulo: 'Arañazo privado',
          descripcion: 'No quiero que nadie lo vea',
          compartirConGrupo: false
        });

      console.log("ERROR BODY:", response.body);
      expect(response.status).toBe(200);
      expect(response.body.incidencia).toHaveProperty('compartirConGrupo', false);
    });
  });

  describe('GET /api/incidencias/usuario', () => {
    it('debería obtener todas las incidencias del usuario', async () => {
      const { token, userId } = await crearYAutenticarUsuario();
      const vehiculoId = await crearVehiculo(token, userId);

      // Crear 2 incidencias
      await request(app)
        .post('/api/incidencias/crear')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Incidencia 1',
          descripcion: 'Descripción 1',
          compartirConGrupo: true
        });

      await request(app)
        .post('/api/incidencias/crear')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehiculoId,
          tipo: 'Daño',
          prioridad: 'Media',
          titulo: 'Incidencia 2',
          descripcion: 'Descripción 2',
          compartirConGrupo: true
        });

      const response = await request(app)
        .get('/api/incidencias/usuario')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('incidencias');
      expect(response.body.incidencias).toHaveLength(2);
    });

    it('debería devolver array vacío si no hay incidencias', async () => {
      const { token } = await crearYAutenticarUsuario();

      const response = await request(app)
        .get('/api/incidencias/usuario')
        .set('Authorization', `Bearer ${token}`);

      console.log("ERROR BODY:", response.body);
      expect(response.status).toBe(200);
      expect(response.body.incidencias).toHaveLength(0);
    });
  });

  describe('GET /api/incidencias/vehiculo/:vehiculoId', () => {
    it('debería obtener las incidencias de un vehículo', async () => {
      const { token, userId } = await crearYAutenticarUsuario();
      const vehiculoId = await crearVehiculo(token, userId);

      // Crear incidencia
      await request(app)
        .post('/api/incidencias/crear')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Incidencia de prueba',
          descripcion: 'Descripción de prueba',
          compartirConGrupo: true
        });

      const response = await request(app)
        .get(`/api/incidencias/vehiculo/${vehiculoId}`)
        .set('Authorization', `Bearer ${token}`);

      console.log("ERROR BODY:", response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('incidencias');
      expect(response.body.incidencias).toHaveLength(1);
      expect(response.body.incidencias[0]).toHaveProperty('titulo', 'Incidencia de prueba');
    });

    it('debería rechazar si el usuario no tiene acceso al vehículo', async () => {
      const { token: token1, userId: userId1 } = await crearYAutenticarUsuario('user1@example.com');
      const { token: token2 } = await crearYAutenticarUsuario('user2@example.com', 'password456');
      
      const vehiculoId = await crearVehiculo(token1, userId1);

      const response = await request(app)
        .get(`/api/incidencias/vehiculo/${vehiculoId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'No tienes permisos para ver las incidencias de este vehículo.');
    });
  });

  describe('GET /api/incidencias/:incidenciaId', () => {
    it('debería obtener una incidencia específica', async () => {
      const { token, userId } = await crearYAutenticarUsuario();
      const vehiculoId = await crearVehiculo(token, userId);

      const createResponse = await request(app)
        .post('/api/incidencias/crear')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Incidencia específica',
          descripcion: 'Descripción específica',
          compartirConGrupo: true
        });

      const incidenciaId = createResponse.body.incidencia.id;

      const response = await request(app)
        .get(`/api/incidencias/${incidenciaId}`)
        .set('Authorization', `Bearer ${token}`);

      console.log("ERROR BODY:", response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('incidencia');
      expect(response.body.incidencia).toHaveProperty('titulo', 'Incidencia específica');
    });

    it('debería devolver 404 si la incidencia no existe', async () => {
      const { token } = await crearYAutenticarUsuario();

      const response = await request(app)
        .get('/api/incidencias/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Incidencia no encontrada.');
    });
  });

  describe('PATCH /api/incidencias/:incidenciaId/estado', () => {
    it('debería actualizar el estado de una incidencia', async () => {
      const { token, userId } = await crearYAutenticarUsuario();
      const vehiculoId = await crearVehiculo(token, userId);

      const createResponse = await request(app)
        .post('/api/incidencias/crear')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Test',
          descripcion: 'Test',
          compartirConGrupo: true
        });

      const incidenciaId = createResponse.body.incidencia.id;

      const response = await request(app)
        .patch(`/api/incidencias/${incidenciaId}/estado`)
        .set('Authorization', `Bearer ${token}`)
        .send({ estado: 'En progreso' });

      console.log("ERROR BODY:", response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Estado de incidencia actualizado correctamente.');
      expect(response.body.incidencia).toHaveProperty('estado', 'En progreso');
    });

    it('debería actualizar a Resuelta y guardar fecha de resolución', async () => {
      const { token, userId } = await crearYAutenticarUsuario();
      const vehiculoId = await crearVehiculo(token, userId);

      const createResponse = await request(app)
        .post('/api/incidencias/crear')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Test',
          descripcion: 'Test',
          compartirConGrupo: true
        });

      const incidenciaId = createResponse.body.incidencia.id;

      const response = await request(app)
        .patch(`/api/incidencias/${incidenciaId}/estado`)
        .set('Authorization', `Bearer ${token}`)
        .send({ estado: 'Resuelta' });

      expect(response.status).toBe(200);
      expect(response.body.incidencia).toHaveProperty('estado', 'Resuelta');
      expect(response.body.incidencia).toHaveProperty('fechaResolucion');
      expect(response.body.incidencia.fechaResolucion).not.toBeNull();
    });

    it('debería rechazar estado no válido', async () => {
      const { token, userId } = await crearYAutenticarUsuario();
      const vehiculoId = await crearVehiculo(token, userId);

      const createResponse = await request(app)
        .post('/api/incidencias/crear')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Test',
          descripcion: 'Test',
          compartirConGrupo: true
        });

      const incidenciaId = createResponse.body.incidencia.id;

      const response = await request(app)
        .patch(`/api/incidencias/${incidenciaId}/estado`)
        .set('Authorization', `Bearer ${token}`)
        .send({ estado: 'EstadoInvalido' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Estado no válido.');
    });
  });

  describe('PUT /api/incidencias/:incidenciaId', () => {
    it('debería actualizar una incidencia completa', async () => {
      const { token, userId } = await crearYAutenticarUsuario();
      const vehiculoId = await crearVehiculo(token, userId);

      const createResponse = await request(app)
        .post('/api/incidencias/crear')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Título original',
          descripcion: 'Descripción original',
          compartirConGrupo: true
        });

      const incidenciaId = createResponse.body.incidencia.id;

      const response = await request(app)
        .put(`/api/incidencias/${incidenciaId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          tipo: 'Daño',
          prioridad: 'Baja',
          titulo: 'Título actualizado',
          descripcion: 'Descripción actualizada',
          estado: 'Resuelta',
          compartirConGrupo: false
        });

      expect(response.status).toBe(200);
      expect(response.body.incidencia).toHaveProperty('titulo', 'Título actualizado');
      expect(response.body.incidencia).toHaveProperty('tipo', 'Daño');
      expect(response.body.incidencia).toHaveProperty('prioridad', 'Baja');
      expect(response.body.incidencia).toHaveProperty('estado', 'Resuelta');
      expect(response.body.incidencia).toHaveProperty('compartirConGrupo', false);
    });
  });

  describe('DELETE /api/incidencias/:incidenciaId', () => {
    it('debería eliminar una incidencia', async () => {
      const { token, userId } = await crearYAutenticarUsuario();
      const vehiculoId = await crearVehiculo(token, userId);

      const createResponse = await request(app)
        .post('/api/incidencias/crear')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Para eliminar',
          descripcion: 'Esta incidencia será eliminada',
          compartirConGrupo: true
        });

      const incidenciaId = createResponse.body.incidencia.id;

      const response = await request(app)
        .delete(`/api/incidencias/${incidenciaId}`)
        .set('Authorization', `Bearer ${token}`);

      console.log("ERROR BODY:", response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Incidencia eliminada correctamente.');

      // Verificar que fue eliminada
      const getResponse = await request(app)
        .get(`/api/incidencias/${incidenciaId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getResponse.status).toBe(404);
    });

    it('debería rechazar si el usuario no tiene permisos', async () => {
      const { token: token1, userId: userId1 } = await crearYAutenticarUsuario('user1@example.com');
      const { token: token2 } = await crearYAutenticarUsuario('user2@example.com', 'password456');
      
      const vehiculoId = await crearVehiculo(token1, userId1);

      const createResponse = await request(app)
        .post('/api/incidencias/crear')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Test',
          descripcion: 'Test',
          compartirConGrupo: true
        });

      const incidenciaId = createResponse.body.incidencia.id;

      const response = await request(app)
        .delete(`/api/incidencias/${incidenciaId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'No tienes permisos para eliminar esta incidencia.');
    });
  });
});