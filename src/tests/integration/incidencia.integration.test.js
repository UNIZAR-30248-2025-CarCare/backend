import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import incidenciaRoutes from '../../routes/incidenciaRoutes.js';
import usuarioRoutes from '../../routes/usuarioRoutes.js';
import vehiculoRoutes from '../../routes/vehiculoRoutes.js';
import { setupDatabase, closeDatabase, cleanDatabase, sequelize } from '../seeders/testSetup.js';

const app = express();
app.use(express.json());
app.use('/api/incidencia', incidenciaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/vehiculos', vehiculoRoutes);

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

  describe('POST /api/incidencia/crear', () => {
    const incidenciaValida = {
      tipo: 'Avería',
      prioridad: 'Alta',
      titulo: 'Problema con el motor',
      descripcion: 'El motor hace un ruido extraño',
      fotos: ['https://example.com/foto1.jpg'],
      compartirConGrupo: true
    };

    it('debería crear una incidencia exitosamente', async () => {
      const response = await request(app)
        .post('/api/incidencia/crear')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoId: vehiculoId,
          ...incidenciaValida
        });

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);

      if (response.status !== 200) {
        throw new Error(`Error interno: ${JSON.stringify(response.body)}`);
    }
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('incidencia');
      expect(response.body.incidencia).toHaveProperty('titulo', 'Problema con el motor');
      expect(response.body.incidencia).toHaveProperty('estado', 'Pendiente');
      expect(response.body.incidencia).toHaveProperty('usuarioId', userId);
    });

    it('debería rechazar incidencia sin autenticación', async () => {
      const response = await request(app)
        .post('/api/incidencia/crear')
        .send({
          vehiculoId: vehiculoId,
          ...incidenciaValida
        });

      expect(response.status).toBe(401);
    });

    it('debería rechazar incidencia con campos faltantes', async () => {
      const response = await request(app)
        .post('/api/incidencia/crear')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoId: vehiculoId,
          tipo: 'Avería'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Faltan campos obligatorios.');
    });

    it('debería rechazar incidencia con tipo inválido', async () => {
      const response = await request(app)
        .post('/api/incidencia/crear')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoId: vehiculoId,
          ...incidenciaValida,
          tipo: 'TipoInvalido'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Tipo de incidencia no válido.');
    });

    it('debería rechazar incidencia con prioridad inválida', async () => {
      const response = await request(app)
        .post('/api/incidencia/crear')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoId: vehiculoId,
          ...incidenciaValida,
          prioridad: 'Urgente'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Prioridad no válida.');
    });

    it('debería rechazar incidencia con vehículo inexistente', async () => {
      const response = await request(app)
        .post('/api/incidencia/crear')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoId: 9999,
          ...incidenciaValida
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Vehículo no encontrado.');
    });

    it('debería crear incidencia con fotos vacías por defecto', async () => {
      const { fotos, ...incidenciaSinFotos } = incidenciaValida;
      
      const response = await request(app)
        .post('/api/incidencia/crear')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoId: vehiculoId,
          ...incidenciaSinFotos
        });

      expect(response.status).toBe(200);
      expect(response.body.incidencia.fotos).toEqual([]);
    });
  });

  describe('GET /api/incidencia/vehiculo/:vehiculoId', () => {
    beforeEach(async () => {
      // Crear algunas incidencias de prueba
      await request(app)
        .post('/api/incidencia/crear')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoId: vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Incidencia 1',
          descripcion: 'Descripción 1',
          compartirConGrupo: true
        });

      await request(app)
        .post('/api/incidencia/crear')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoId: vehiculoId,
          tipo: 'Daño',
          prioridad: 'Media',
          titulo: 'Incidencia 2',
          descripcion: 'Descripción 2',
          compartirConGrupo: true
        });
    });

    it('debería obtener todas las incidencias de un vehículo', async () => {
      const response = await request(app)
        .get(`/api/incidencia/vehiculo/${vehiculoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('incidencias');
      expect(response.body.incidencias).toHaveLength(2);
      expect(response.body.incidencias[0]).toHaveProperty('Usuario');
    });

    it('debería devolver array vacío si el vehículo no tiene incidencias', async () => {
      // Crear nuevo vehículo sin incidencias
      const nuevoVehiculoResponse = await request(app)
        .post('/api/vehiculos/registrar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: userId,
          fabricante: 'Honda',
          modelo: 'Civic',
          nombre: 'Mi Honda',
          antiguedad: 2021,
          matricula: 'XYZ 5678',
          tipo_combustible: 'Gasolina',
          consumo_medio: 7.0,
          litros_combustible: 45.0,
          ubicacion_actual: { latitud: 40.4168, longitud: -3.7038 },
          estado: 'Activo',
          tipo: 'Coche'
        });

      const response = await request(app)
        .get(`/api/incidencia/vehiculo/${nuevoVehiculoResponse.body.vehiculo.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.incidencias).toEqual([]);
    });

    it('debería rechazar petición sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/incidencia/vehiculo/${vehiculoId}`);

      expect(response.status).toBe(401);
    });

    it('debería rechazar si el vehículo no existe', async () => {
      const response = await request(app)
        .get('/api/incidencia/vehiculo/9999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Vehículo no encontrado.');
    });
  });

  describe('GET /api/incidencia/usuario', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/incidencia/crear')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoId: vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Incidencia del usuario',
          descripcion: 'Descripción de prueba',
          compartirConGrupo: true
        });
    });

    it('debería obtener todas las incidencias del usuario', async () => {
      const response = await request(app)
        .get('/api/incidencia/usuario')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('incidencias');
      expect(response.body.incidencias.length).toBeGreaterThan(0);
      expect(response.body.incidencias[0]).toHaveProperty('Usuario');
      expect(response.body.incidencias[0]).toHaveProperty('Vehiculo');
    });

    it('debería rechazar petición sin autenticación', async () => {
      const response = await request(app)
        .get('/api/incidencia/usuario');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/incidencia/:incidenciaId', () => {
    let incidenciaId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/incidencia/crear')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoId: vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Incidencia específica',
          descripcion: 'Descripción específica',
          compartirConGrupo: true
        });

      incidenciaId = createResponse.body.incidencia.id;
    });

    it('debería obtener una incidencia específica', async () => {
      const response = await request(app)
        .get(`/api/incidencia/${incidenciaId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('incidencia');
      expect(response.body.incidencia).toHaveProperty('id', incidenciaId);
      expect(response.body.incidencia).toHaveProperty('titulo', 'Incidencia específica');
    });

    it('debería rechazar si la incidencia no existe', async () => {
      const response = await request(app)
        .get('/api/incidencia/9999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Incidencia no encontrada.');
    });

    it('debería rechazar petición sin autenticación', async () => {
      const response = await request(app)
        .get(`/api/incidencia/${incidenciaId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/incidencia/:incidenciaId/estado', () => {
    let incidenciaId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/incidencia/crear')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoId: vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Incidencia para actualizar',
          descripcion: 'Descripción',
          compartirConGrupo: true
        });

      incidenciaId = createResponse.body.incidencia.id;
    });

    it('debería actualizar el estado de una incidencia', async () => {
      const response = await request(app)
        .patch(`/api/incidencia/${incidenciaId}/estado`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ estado: 'En progreso' });

      expect(response.status).toBe(200);
      expect(response.body.incidencia).toHaveProperty('estado', 'En progreso');
    });

    it('debería establecer fecha de resolución al marcar como resuelta', async () => {
      const response = await request(app)
        .patch(`/api/incidencia/${incidenciaId}/estado`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ estado: 'Resuelta' });

      expect(response.status).toBe(200);
      expect(response.body.incidencia).toHaveProperty('estado', 'Resuelta');
      expect(response.body.incidencia.fechaResolucion).not.toBeNull();
    });

    it('debería rechazar estado inválido', async () => {
      const response = await request(app)
        .patch(`/api/incidencia/${incidenciaId}/estado`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ estado: 'EstadoInvalido' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Estado no válido.');
    });

    it('debería rechazar petición sin autenticación', async () => {
      const response = await request(app)
        .patch(`/api/incidencia/${incidenciaId}/estado`)
        .send({ estado: 'En progreso' });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/incidencia/:incidenciaId', () => {
    let incidenciaId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/incidencia/crear')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoId: vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Título original',
          descripcion: 'Descripción original',
          compartirConGrupo: true
        });

      incidenciaId = createResponse.body.incidencia.id;
    });

    it('debería actualizar una incidencia completa', async () => {
      const response = await request(app)
        .put(`/api/incidencia/${incidenciaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tipo: 'Daño',
          prioridad: 'Baja',
          titulo: 'Título actualizado',
          descripcion: 'Descripción actualizada'
        });

      expect(response.status).toBe(200);
      expect(response.body.incidencia).toHaveProperty('tipo', 'Daño');
      expect(response.body.incidencia).toHaveProperty('prioridad', 'Baja');
      expect(response.body.incidencia).toHaveProperty('titulo', 'Título actualizado');
    });

    it('debería rechazar tipo inválido', async () => {
      const response = await request(app)
        .put(`/api/incidencia/${incidenciaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tipo: 'TipoInvalido' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Tipo de incidencia no válido.');
    });

    it('debería rechazar prioridad inválida', async () => {
      const response = await request(app)
        .put(`/api/incidencia/${incidenciaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ prioridad: 'Urgente' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Prioridad no válida.');
    });

    it('debería rechazar petición sin autenticación', async () => {
      const response = await request(app)
        .put(`/api/incidencia/${incidenciaId}`)
        .send({ titulo: 'Nuevo título' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/incidencia/:incidenciaId', () => {
    let incidenciaId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/incidencia/crear')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoId: vehiculoId,
          tipo: 'Avería',
          prioridad: 'Alta',
          titulo: 'Incidencia para eliminar',
          descripcion: 'Descripción',
          compartirConGrupo: true
        });

      incidenciaId = createResponse.body.incidencia.id;
    });

    it('debería eliminar una incidencia exitosamente', async () => {
      const response = await request(app)
        .delete(`/api/incidencia/${incidenciaId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Incidencia eliminada correctamente.');

      // Verificar que la incidencia fue eliminada
      const getResponse = await request(app)
        .get(`/api/incidencia/${incidenciaId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('debería rechazar si la incidencia no existe', async () => {
      const response = await request(app)
        .delete('/api/incidencia/9999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Incidencia no encontrada.');
    });

    it('debería rechazar petición sin autenticación', async () => {
      const response = await request(app)
        .delete(`/api/incidencia/${incidenciaId}`);

      expect(response.status).toBe(401);
    });
  });
});
