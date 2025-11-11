import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  crearIncidencia,
  obtenerIncidenciasVehiculo,
  obtenerIncidenciasUsuario,
  obtenerIncidencia,
  actualizarEstadoIncidencia,
  actualizarIncidencia,
  eliminarIncidencia
} from '../../controllers/incidenciaController.js';
import { Incidencia, Vehiculo, Usuario } from '../../models/index.js';

// Mock de los modelos
vi.mock('../../models/index.js', () => ({
  Incidencia: {
    create: vi.fn(),
    findAll: vi.fn(),
    findByPk: vi.fn()
  },
  Vehiculo: {
    findByPk: vi.fn()
  },
  Usuario: {
    findByPk: vi.fn()
  }
}));

describe('Incidencia Controller - Tests Unitarios', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {},
      params: {},
      usuario: { id: 1 }
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  describe('crearIncidencia', () => {
    const incidenciaValida = {
      vehiculoId: 1,
      tipo: 'Avería',
      prioridad: 'Alta',
      titulo: 'Problema con el motor',
      descripcion: 'El motor hace un ruido extraño',
      fotos: ['https://example.com/foto1.jpg'],
      compartirConGrupo: true
    };

    it('debería crear una incidencia exitosamente', async () => {
      req.body = incidenciaValida;

      const mockVehiculo = {
        id: 1,
        Usuarios: [{ id: 1 }]
      };

      const mockIncidencia = {
        id: 1,
        ...incidenciaValida,
        usuarioId: 1,
        estado: 'Pendiente',
        fechaCreacion: new Date()
      };

      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);
      Incidencia.create.mockResolvedValue(mockIncidencia);

      await crearIncidencia(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Incidencia creada exitosamente.',
        incidencia: mockIncidencia
      });
    });

    it('debería rechazar si faltan campos obligatorios', async () => {
      req.body = {
        vehiculoId: 1,
        tipo: 'Avería'
        // Faltan campos obligatorios
      };

      await crearIncidencia(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Faltan campos obligatorios.'
      });
    });

    it('debería rechazar tipo de incidencia inválido', async () => {
      req.body = {
        ...incidenciaValida,
        tipo: 'TipoInvalido'
      };

      await crearIncidencia(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Tipo de incidencia no válido.'
      });
    });

    it('debería rechazar prioridad inválida', async () => {
      req.body = {
        ...incidenciaValida,
        prioridad: 'Urgente'
      };

      await crearIncidencia(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Prioridad no válida.'
      });
    });

    it('debería rechazar si el vehículo no existe', async () => {
      req.body = incidenciaValida;
      Vehiculo.findByPk.mockResolvedValue(null);

      await crearIncidencia(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Vehículo no encontrado.'
      });
    });

    it('debería rechazar si el usuario no está vinculado al vehículo', async () => {
      req.body = incidenciaValida;

      const mockVehiculo = {
        id: 1,
        Usuarios: [{ id: 2 }] // Diferente usuario
      };

      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);

      await crearIncidencia(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No tienes permisos para crear incidencias en este vehículo.'
      });
    });
  });

  describe('obtenerIncidenciasVehiculo', () => {
    it('debería obtener todas las incidencias de un vehículo', async () => {
      req.params = { vehiculoId: '1' };

      const mockVehiculo = {
        id: 1,
        Usuarios: [{ id: 1 }]
      };

      const mockIncidencias = [
        {
          id: 1,
          tipo: 'Avería',
          titulo: 'Problema 1',
          Usuario: { id: 1, nombre: 'Test User', email: 'test@example.com' }
        },
        {
          id: 2,
          tipo: 'Daño',
          titulo: 'Problema 2',
          Usuario: { id: 1, nombre: 'Test User', email: 'test@example.com' }
        }
      ];

      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);
      Incidencia.findAll.mockResolvedValue(mockIncidencias);

      await obtenerIncidenciasVehiculo(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        incidencias: mockIncidencias
      });
    });

    it('debería rechazar si el vehículo no existe', async () => {
      req.params = { vehiculoId: '1' };
      Vehiculo.findByPk.mockResolvedValue(null);

      await obtenerIncidenciasVehiculo(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Vehículo no encontrado.'
      });
    });

    it('debería rechazar si el usuario no tiene permisos', async () => {
      req.params = { vehiculoId: '1' };

      const mockVehiculo = {
        id: 1,
        Usuarios: [{ id: 2 }] // Diferente usuario
      };

      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);

      await obtenerIncidenciasVehiculo(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No tienes permisos para ver las incidencias de este vehículo.'
      });
    });
  });

  describe('obtenerIncidenciasUsuario', () => {
    it('debería obtener todas las incidencias del usuario', async () => {
      const mockUsuario = {
        id: 1,
        getVehiculos: vi.fn().mockResolvedValue([
          { id: 1 },
          { id: 2 }
        ])
      };

      const mockIncidencias = [
        {
          id: 1,
          tipo: 'Avería',
          Usuario: { id: 1, nombre: 'Test User', email: 'test@example.com' },
          Vehiculo: { id: 1, nombre: 'Vehículo 1' }
        }
      ];

      Usuario.findByPk.mockResolvedValue(mockUsuario);
      Incidencia.findAll.mockResolvedValue(mockIncidencias);

      await obtenerIncidenciasUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        incidencias: mockIncidencias
      });
    });

    it('debería rechazar si el usuario no existe', async () => {
      Usuario.findByPk.mockResolvedValue(null);

      await obtenerIncidenciasUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado.'
      });
    });
  });

  describe('obtenerIncidencia', () => {
    it('debería obtener una incidencia específica', async () => {
      req.params = { incidenciaId: '1' };

      const mockIncidencia = {
        id: 1,
        tipo: 'Avería',
        Usuario: { id: 1, nombre: 'Test User', email: 'test@example.com' },
        Vehiculo: {
          id: 1,
          nombre: 'Vehículo 1',
          Usuarios: [{ id: 1 }]
        }
      };

      Incidencia.findByPk.mockResolvedValue(mockIncidencia);

      await obtenerIncidencia(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        incidencia: mockIncidencia
      });
    });

    it('debería rechazar si la incidencia no existe', async () => {
      req.params = { incidenciaId: '1' };
      Incidencia.findByPk.mockResolvedValue(null);

      await obtenerIncidencia(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Incidencia no encontrada.'
      });
    });

    it('debería rechazar si el usuario no tiene permisos', async () => {
      req.params = { incidenciaId: '1' };

      const mockIncidencia = {
        id: 1,
        Vehiculo: {
          Usuarios: [{ id: 2 }] // Diferente usuario
        }
      };

      Incidencia.findByPk.mockResolvedValue(mockIncidencia);

      await obtenerIncidencia(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No tienes permisos para ver esta incidencia.'
      });
    });
  });

  describe('actualizarEstadoIncidencia', () => {
    it('debería actualizar el estado de una incidencia', async () => {
      req.params = { incidenciaId: '1' };
      req.body = { estado: 'En progreso' };

      const mockIncidencia = {
        id: 1,
        estado: 'Pendiente',
        save: vi.fn(),
        Vehiculo: {
          Usuarios: [{ id: 1 }]
        }
      };

      Incidencia.findByPk.mockResolvedValue(mockIncidencia);

      await actualizarEstadoIncidencia(req, res);

      expect(mockIncidencia.estado).toBe('En progreso');
      expect(mockIncidencia.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debería establecer fecha de resolución al marcar como resuelta', async () => {
      req.params = { incidenciaId: '1' };
      req.body = { estado: 'Resuelta' };

      const mockIncidencia = {
        id: 1,
        estado: 'Pendiente',
        fechaResolucion: null,
        save: vi.fn(),
        Vehiculo: {
          Usuarios: [{ id: 1 }]
        }
      };

      Incidencia.findByPk.mockResolvedValue(mockIncidencia);

      await actualizarEstadoIncidencia(req, res);

      expect(mockIncidencia.estado).toBe('Resuelta');
      expect(mockIncidencia.fechaResolucion).not.toBeNull();
      expect(mockIncidencia.save).toHaveBeenCalled();
    });

    it('debería rechazar estado inválido', async () => {
      req.params = { incidenciaId: '1' };
      req.body = { estado: 'EstadoInvalido' };

      await actualizarEstadoIncidencia(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Estado no válido.'
      });
    });
  });

  describe('actualizarIncidencia', () => {
    it('debería actualizar una incidencia completa', async () => {
      req.params = { incidenciaId: '1' };
      req.body = {
        tipo: 'Daño',
        prioridad: 'Baja',
        titulo: 'Título actualizado',
        descripcion: 'Descripción actualizada'
      };

      const mockIncidencia = {
        id: 1,
        tipo: 'Avería',
        prioridad: 'Alta',
        titulo: 'Título original',
        descripcion: 'Descripción original',
        save: vi.fn(),
        Vehiculo: {
          Usuarios: [{ id: 1 }]
        }
      };

      Incidencia.findByPk.mockResolvedValue(mockIncidencia);

      await actualizarIncidencia(req, res);

      expect(mockIncidencia.tipo).toBe('Daño');
      expect(mockIncidencia.prioridad).toBe('Baja');
      expect(mockIncidencia.titulo).toBe('Título actualizado');
      expect(mockIncidencia.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debería rechazar tipo inválido', async () => {
      req.params = { incidenciaId: '1' };
      req.body = { tipo: 'TipoInvalido' };

      const mockIncidencia = {
        id: 1,
        Vehiculo: {
          Usuarios: [{ id: 1 }]
        }
      };

      Incidencia.findByPk.mockResolvedValue(mockIncidencia);

      await actualizarIncidencia(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Tipo de incidencia no válido.'
      });
    });
  });

  describe('eliminarIncidencia', () => {
    it('debería eliminar una incidencia', async () => {
      req.params = { incidenciaId: '1' };

      const mockIncidencia = {
        id: 1,
        usuarioId: 1,
        destroy: vi.fn(),
        Vehiculo: {
          Usuarios: [{ id: 1 }]
        }
      };

      Incidencia.findByPk.mockResolvedValue(mockIncidencia);

      await eliminarIncidencia(req, res);

      expect(mockIncidencia.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Incidencia eliminada correctamente.'
      });
    });

    it('debería rechazar si la incidencia no existe', async () => {
      req.params = { incidenciaId: '1' };
      Incidencia.findByPk.mockResolvedValue(null);

      await eliminarIncidencia(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Incidencia no encontrada.'
      });
    });

    it('debería rechazar si el usuario no tiene permisos', async () => {
      req.params = { incidenciaId: '1' };

      const mockIncidencia = {
        id: 1,
        usuarioId: 2, // Diferente usuario
        Vehiculo: {
          Usuarios: [{ id: 2 }] // Diferente usuario
        }
      };

      Incidencia.findByPk.mockResolvedValue(mockIncidencia);

      await eliminarIncidencia(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No tienes permisos para eliminar esta incidencia.'
      });
    });
  });
});
