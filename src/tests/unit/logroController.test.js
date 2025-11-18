import { describe, it, expect, beforeEach, vi } from 'vitest';
import { obtenerTodosLosLogros, obtenerLogrosUsuario, verificarProgreso } from '../../controllers/logroController.js';
import Logro from '../../models/Logro.js';
import UsuarioLogro from '../../models/UsuarioLogro.js';
import Usuario from '../../models/Usuario.js';
import Viaje from '../../models/Viaje.js';
import Repostaje from '../../models/Repostaje.js';
import Reserva from '../../models/Reserva.js';

// Mock de los modelos
vi.mock('../../models/Logro.js');
vi.mock('../../models/UsuarioLogro.js');
vi.mock('../../models/Usuario.js');
vi.mock('../../models/Viaje.js');
vi.mock('../../models/Repostaje.js');
vi.mock('../../models/Reserva.js');

describe('Logro Controller - Tests Unitarios', () => {
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

  describe('obtenerTodosLosLogros', () => {
    it('debería obtener todos los logros activos', async () => {
      const mockLogros = [
        { id: 1, nombre: 'Primer Viaje', tipo: 'VIAJES', criterio: 1, puntos: 10, activo: true },
        { id: 2, nombre: 'Explorador', tipo: 'DISTANCIA', criterio: 100, puntos: 25, activo: true }
      ];

      Logro.findAll.mockResolvedValue(mockLogros);

      await obtenerTodosLosLogros(req, res);

      expect(Logro.findAll).toHaveBeenCalledWith({
        where: { activo: true },
        order: [['puntos', 'ASC'], ['nombre', 'ASC']]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ logros: mockLogros });
    });

    it('debería devolver array vacío si no hay logros', async () => {
      Logro.findAll.mockResolvedValue([]);

      await obtenerTodosLosLogros(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ logros: [] });
    });

    it('debería manejar errores en la consulta', async () => {
      Logro.findAll.mockRejectedValue(new Error('Database error'));

      await obtenerTodosLosLogros(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener los logros' });
    });
  });

  describe('obtenerLogrosUsuario', () => {
    it('debería obtener logros del usuario con progreso', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      const mockLogrosUsuario = [
        {
          logroId: 1,
          progreso: 5,
          desbloqueado: true,
          fechaObtenido: new Date('2025-01-01')
        }
      ];

      const mockTodosLogros = [
        { id: 1, nombre: 'Primer Viaje', descripcion: 'Completa tu primer viaje', tipo: 'VIAJES', criterio: 1, icono: '🚗', puntos: 10, activo: true },
        { id: 2, nombre: 'Explorador', descripcion: 'Recorre 100 km', tipo: 'DISTANCIA', criterio: 100, icono: '🌍', puntos: 25, activo: true }
      ];

      UsuarioLogro.findAll.mockResolvedValue(mockLogrosUsuario);
      Logro.findAll.mockResolvedValue(mockTodosLogros);

      await obtenerLogrosUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          logros: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              nombre: 'Primer Viaje',
              progreso: 5,
              desbloqueado: true,
              porcentaje: 100
            }),
            expect.objectContaining({
              id: 2,
              nombre: 'Explorador',
              progreso: 0,
              desbloqueado: false,
              porcentaje: 0
            })
          ]),
          estadisticas: expect.objectContaining({
            totalLogros: 2,
            desbloqueados: 1,
            pendientes: 1,
            puntosTotales: 10,
            porcentajeCompletado: 50
          })
        })
      );
    });

    it('debería ordenar logros por puntos ascendente', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      const mockTodosLogros = [
        { id: 1, nombre: 'Logro 50pts', tipo: 'VIAJES', criterio: 10, puntos: 50, activo: true },
        { id: 2, nombre: 'Logro 10pts', tipo: 'VIAJES', criterio: 1, puntos: 10, activo: true },
        { id: 3, nombre: 'Logro 25pts', tipo: 'VIAJES', criterio: 5, puntos: 25, activo: true }
      ];

      UsuarioLogro.findAll.mockResolvedValue([]);
      Logro.findAll.mockResolvedValue(mockTodosLogros);

      await obtenerLogrosUsuario(req, res);

      const logros = res.json.mock.calls[0][0].logros;
      expect(logros[0].puntos).toBe(10);
      expect(logros[1].puntos).toBe(25);
      expect(logros[2].puntos).toBe(50);
    });

    it('debería rechazar si el usuario intenta ver logros de otro', async () => {
      req.params = { usuarioId: '2' };
      req.usuario = { id: 1 };

      await obtenerLogrosUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'No tienes permisos para ver estos logros' });
    });

    it('debería calcular porcentaje correctamente', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      const mockLogrosUsuario = [
        { logroId: 1, progreso: 50, desbloqueado: false, fechaObtenido: null }
      ];

      const mockTodosLogros = [
        { id: 1, nombre: 'Logro', tipo: 'DISTANCIA', criterio: 100, puntos: 10, activo: true }
      ];

      UsuarioLogro.findAll.mockResolvedValue(mockLogrosUsuario);
      Logro.findAll.mockResolvedValue(mockTodosLogros);

      await obtenerLogrosUsuario(req, res);

      const logros = res.json.mock.calls[0][0].logros;
      expect(logros[0].porcentaje).toBe(50);
    });

    it('debería limitar porcentaje a 100', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      const mockLogrosUsuario = [
        { logroId: 1, progreso: 150, desbloqueado: true, fechaObtenido: new Date() }
      ];

      const mockTodosLogros = [
        { id: 1, nombre: 'Logro', tipo: 'VIAJES', criterio: 100, puntos: 10, activo: true }
      ];

      UsuarioLogro.findAll.mockResolvedValue(mockLogrosUsuario);
      Logro.findAll.mockResolvedValue(mockTodosLogros);

      await obtenerLogrosUsuario(req, res);

      const logros = res.json.mock.calls[0][0].logros;
      expect(logros[0].porcentaje).toBe(100);
    });

    it('debería manejar errores en la consulta', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      UsuarioLogro.findAll.mockRejectedValue(new Error('Database error'));

      await obtenerLogrosUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al obtener los logros del usuario' });
    });
  });

  describe('verificarProgreso', () => {
    it('debería verificar progreso y desbloquear logro de VIAJES', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      const mockLogros = [
        { id: 1, nombre: 'Primer Viaje', descripcion: 'Desc', tipo: 'VIAJES', criterio: 1, icono: '🚗', puntos: 10, activo: true }
      ];

      Logro.findAll.mockResolvedValue(mockLogros);
      Viaje.count.mockResolvedValue(1);

      const mockUsuarioLogro = {
        desbloqueado: false,
        progreso: 0,
        save: vi.fn().mockResolvedValue(true)
      };

      UsuarioLogro.findOrCreate.mockResolvedValue([mockUsuarioLogro, false]);

      await verificarProgreso(req, res);

      expect(mockUsuarioLogro.progreso).toBe(1);
      expect(mockUsuarioLogro.desbloqueado).toBe(true);
      expect(mockUsuarioLogro.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Progreso actualizado exitosamente',
          nuevosLogros: expect.arrayContaining([
            expect.objectContaining({
              nombre: 'Primer Viaje',
              puntos: 10
            })
          ]),
          totalNuevos: 1
        })
      );
    });

    it('debería verificar progreso de DISTANCIA', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      const mockLogros = [
        { id: 1, nombre: 'Explorador', tipo: 'DISTANCIA', criterio: 100, puntos: 25, activo: true }
      ];

      Logro.findAll.mockResolvedValue(mockLogros);
      Viaje.findAll.mockResolvedValue([
        { kmRealizados: '50.5' },
        { kmRealizados: '75.3' }
      ]);

      const mockUsuarioLogro = {
        desbloqueado: false,
        progreso: 0,
        save: vi.fn()
      };

      UsuarioLogro.findOrCreate.mockResolvedValue([mockUsuarioLogro, false]);

      await verificarProgreso(req, res);

      expect(mockUsuarioLogro.progreso).toBe(125); // Math.floor(125.8)
      expect(mockUsuarioLogro.desbloqueado).toBe(true);
    });

    it('debería verificar progreso de REPOSTAJES', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      const mockLogros = [
        { id: 1, nombre: 'Primera Recarga', tipo: 'REPOSTAJES', criterio: 1, puntos: 5, activo: true }
      ];

      Logro.findAll.mockResolvedValue(mockLogros);
      Repostaje.count.mockResolvedValue(3);

      const mockUsuarioLogro = {
        desbloqueado: false,
        progreso: 0,
        save: vi.fn()
      };

      UsuarioLogro.findOrCreate.mockResolvedValue([mockUsuarioLogro, false]);

      await verificarProgreso(req, res);

      expect(mockUsuarioLogro.progreso).toBe(3);
      expect(mockUsuarioLogro.desbloqueado).toBe(true);
    });

    it('debería verificar progreso de RESERVAS', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      const mockLogros = [
        { id: 1, nombre: 'Primera Reserva', tipo: 'RESERVAS', criterio: 1, puntos: 5, activo: true }
      ];

      Logro.findAll.mockResolvedValue(mockLogros);
      Reserva.count.mockResolvedValue(2);

      const mockUsuarioLogro = {
        desbloqueado: false,
        progreso: 0,
        save: vi.fn()
      };

      UsuarioLogro.findOrCreate.mockResolvedValue([mockUsuarioLogro, false]);

      await verificarProgreso(req, res);

      expect(mockUsuarioLogro.progreso).toBe(2);
      expect(mockUsuarioLogro.desbloqueado).toBe(true);
    });

    it('debería verificar progreso de VEHICULOS', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      const mockLogros = [
        { id: 1, nombre: 'Primer Vehículo', tipo: 'VEHICULOS', criterio: 1, puntos: 5, activo: true }
      ];

      const mockUsuario = {
        countVehiculos: vi.fn().mockResolvedValue(2)
      };

      Logro.findAll.mockResolvedValue(mockLogros);
      Usuario.findByPk.mockResolvedValue(mockUsuario);

      const mockUsuarioLogro = {
        desbloqueado: false,
        progreso: 0,
        save: vi.fn()
      };

      UsuarioLogro.findOrCreate.mockResolvedValue([mockUsuarioLogro, false]);

      await verificarProgreso(req, res);

      expect(mockUsuarioLogro.progreso).toBe(2);
      expect(mockUsuarioLogro.desbloqueado).toBe(true);
    });

    it('debería crear nuevo UsuarioLogro si no existe', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      const mockLogros = [
        { id: 1, nombre: 'Logro', tipo: 'VIAJES', criterio: 5, puntos: 10, activo: true }
      ];

      Logro.findAll.mockResolvedValue(mockLogros);
      Viaje.count.mockResolvedValue(10);

      const mockUsuarioLogro = {
        desbloqueado: true,
        progreso: 10
      };

      UsuarioLogro.findOrCreate.mockResolvedValue([mockUsuarioLogro, true]);

      await verificarProgreso(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          nuevosLogros: expect.arrayContaining([
            expect.objectContaining({ nombre: 'Logro' })
          ])
        })
      );
    });

    it('debería no actualizar si el logro ya estaba desbloqueado', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      const mockLogros = [
        { id: 1, nombre: 'Logro', tipo: 'VIAJES', criterio: 1, puntos: 10, activo: true }
      ];

      Logro.findAll.mockResolvedValue(mockLogros);
      Viaje.count.mockResolvedValue(5);

      const mockUsuarioLogro = {
        desbloqueado: true,
        progreso: 1,
        save: vi.fn()
      };

      UsuarioLogro.findOrCreate.mockResolvedValue([mockUsuarioLogro, false]);

      await verificarProgreso(req, res);

      expect(mockUsuarioLogro.progreso).toBe(5);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          nuevosLogros: [],
          totalNuevos: 0
        })
      );
    });

    it('debería devolver array vacío si no hay nuevos logros', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      const mockLogros = [
        { id: 1, nombre: 'Logro', tipo: 'VIAJES', criterio: 10, puntos: 10, activo: true }
      ];

      Logro.findAll.mockResolvedValue(mockLogros);
      Viaje.count.mockResolvedValue(0);

      const mockUsuarioLogro = {
        desbloqueado: false,
        progreso: 0,
        save: vi.fn()
      };

      UsuarioLogro.findOrCreate.mockResolvedValue([mockUsuarioLogro, false]);

      await verificarProgreso(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          nuevosLogros: [],
          totalNuevos: 0
        })
      );
    });

    it('debería rechazar si el usuario intenta verificar logros de otro', async () => {
      req.params = { usuarioId: '2' };
      req.usuario = { id: 1 };

      await verificarProgreso(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'No tienes permisos' });
    });

    it('debería manejar tipo de logro desconocido', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      const mockLogros = [
        { id: 1, nombre: 'Logro Desconocido', tipo: 'TIPO_INVALIDO', criterio: 10, puntos: 10, activo: true }
      ];

      Logro.findAll.mockResolvedValue(mockLogros);

      const mockUsuarioLogro = {
        desbloqueado: false,
        progreso: 0,
        save: vi.fn()
      };

      UsuarioLogro.findOrCreate.mockResolvedValue([mockUsuarioLogro, false]);

      await verificarProgreso(req, res);

      expect(mockUsuarioLogro.progreso).toBe(0);
      expect(mockUsuarioLogro.desbloqueado).toBe(false);
    });

    it('debería manejar errores en el cálculo de progreso', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      const mockLogros = [
        { id: 1, nombre: 'Logro', tipo: 'VIAJES', criterio: 1, puntos: 10, activo: true }
      ];

      Logro.findAll.mockResolvedValue(mockLogros);
      Viaje.count.mockRejectedValue(new Error('Database error'));

      const mockUsuarioLogro = {
        desbloqueado: false,
        progreso: 0,
        save: vi.fn()
      };

      UsuarioLogro.findOrCreate.mockResolvedValue([mockUsuarioLogro, false]);

      await verificarProgreso(req, res);

      // El progreso debe ser 0 cuando hay error
      expect(mockUsuarioLogro.progreso).toBe(0);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debería manejar errores generales en verificarProgreso', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      Logro.findAll.mockRejectedValue(new Error('Database error'));

      await verificarProgreso(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error al verificar el progreso' });
    });

    it('debería establecer fechaObtenido al desbloquear logro', async () => {
      req.params = { usuarioId: '1' };
      req.usuario = { id: 1 };

      const mockLogros = [
        { id: 1, nombre: 'Logro', tipo: 'VIAJES', criterio: 1, puntos: 10, activo: true }
      ];

      Logro.findAll.mockResolvedValue(mockLogros);
      Viaje.count.mockResolvedValue(1);

      const mockUsuarioLogro = {
        desbloqueado: false,
        progreso: 0,
        fechaObtenido: null,
        save: vi.fn()
      };

      UsuarioLogro.findOrCreate.mockResolvedValue([mockUsuarioLogro, false]);

      await verificarProgreso(req, res);

      expect(mockUsuarioLogro.fechaObtenido).toBeInstanceOf(Date);
    });
  });
});
