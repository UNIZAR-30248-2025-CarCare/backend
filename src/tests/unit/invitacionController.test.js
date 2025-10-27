import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generarInvitacion, aceptarInvitacion, rechazarInvitacion, obtenerInvitacionesRecibidas } from '../../controllers/invitacionController.js';

// Mock de los modelos
vi.mock('../../models/Vehiculo.js', () => ({
  default: {
    findByPk: vi.fn()
  }
}));

vi.mock('../../models/Invitacion.js', () => ({
  default: {
    create: vi.fn(),
    findOne: vi.fn(),
    findByPk: vi.fn(),
    findAll: vi.fn()
  }
}));

vi.mock('../../models/index.js', () => ({
  Usuario: {
    findOne: vi.fn(),
    findByPk: vi.fn()
  }
}));

// Importar los modelos mockeados
import Vehiculo from '../../models/Vehiculo.js';
import Invitacion from '../../models/Invitacion.js';
import { Usuario } from '../../models/index.js';

describe('Invitacion Controller - Tests Unitarios', () => {
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

  describe('generarInvitacion', () => {
    it('debería generar una invitación exitosamente', async () => {
      req.params = { vehiculoId: '1' };
      req.body = {
        usuarioId: 1,
        emailInvitado: 'invitado@example.com'
      };

      const mockVehiculo = {
        id: 1,
        nombre: 'Mi Tesla',
        matricula: '1234ABC'
      };

      const mockInvitado = {
        id: 2,
        email: 'invitado@example.com'
      };

      const mockInvitacion = {
        id: 1,
        vehiculoId: 1,
        creadoPorId: 1,
        usuarioInvitadoId: 2,
        codigo: 'JOIN-ABC123',
        usado: false
      };

      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);
      Usuario.findOne.mockResolvedValue(mockInvitado);
      Invitacion.findOne.mockResolvedValue(null); // No hay invitación existente
      Invitacion.create.mockResolvedValue(mockInvitacion);

      await generarInvitacion(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invitación generada exitosamente',
          codigo: expect.any(String),
          vehiculo: expect.objectContaining({
            id: 1,
            nombre: 'Mi Tesla'
          })
        })
      );
    });

    it('debería rechazar si el vehículo no existe', async () => {
      req.params = { vehiculoId: '999' };
      req.body = {
        usuarioId: 1,
        emailInvitado: 'invitado@example.com'
      };

      Vehiculo.findByPk.mockResolvedValue(null);

      await generarInvitacion(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Vehículo no encontrado.'
      });
    });

    it('debería rechazar si el usuario invitado no existe', async () => {
      req.params = { vehiculoId: '1' };
      req.body = {
        usuarioId: 1,
        emailInvitado: 'noexiste@example.com'
      };

      const mockVehiculo = {
        id: 1,
        nombre: 'Mi Tesla',
        matricula: '1234ABC'
      };

      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);
      Usuario.findOne.mockResolvedValue(null);

      await generarInvitacion(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario invitado no encontrado.'
      });
    });

    it('debería rechazar si el usuario intenta invitarse a sí mismo', async () => {
      req.params = { vehiculoId: '1' };
      req.body = {
        usuarioId: 1,
        emailInvitado: 'mismo@example.com'
      };

      const mockVehiculo = {
        id: 1,
        nombre: 'Mi Tesla',
        matricula: '1234ABC'
      };

      const mockUsuario = {
        id: 1,
        email: 'mismo@example.com'
      };

      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);
      Usuario.findOne.mockResolvedValue(mockUsuario);

      await generarInvitacion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No puedes invitarte a ti mismo.'
      });
    });

    it('debería rechazar si ya existe una invitación activa', async () => {
      req.params = { vehiculoId: '1' };
      req.body = {
        usuarioId: 1,
        emailInvitado: 'invitado@example.com'
      };

      const mockVehiculo = {
        id: 1,
        nombre: 'Mi Tesla',
        matricula: '1234ABC'
      };

      const mockInvitado = {
        id: 2,
        email: 'invitado@example.com'
      };

      const mockInvitacionExistente = {
        id: 1,
        vehiculoId: 1,
        creadoPorId: 1,
        usuarioInvitadoId: 2,
        usado: false
      };

      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);
      Usuario.findOne.mockResolvedValue(mockInvitado);
      Invitacion.findOne.mockResolvedValue(mockInvitacionExistente);

      await generarInvitacion(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Ya existe una invitación activa para este usuario y vehículo.'
      });
    });
  });

  describe('aceptarInvitacion', () => {
    it('debería aceptar una invitación exitosamente', async () => {
      req.body = { codigo: 'JOIN-ABC123' };

      const mockInvitacion = {
        id: 1,
        vehiculoId: 1,
        usuarioInvitadoId: 2,
        codigo: 'JOIN-ABC123',
        usado: false,
        save: vi.fn()
      };

      const mockVehiculo = {
        id: 1,
        nombre: 'Mi Tesla',
        matricula: '1234ABC',
        addUsuario: vi.fn()
      };

      Invitacion.findOne.mockResolvedValue(mockInvitacion);
      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);

      await aceptarInvitacion(req, res);

      expect(mockVehiculo.addUsuario).toHaveBeenCalledWith(2);
      expect(mockInvitacion.usado).toBe(true);
      expect(mockInvitacion.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invitación aceptada correctamente. Ahora eres copropietario del vehículo.'
        })
      );
    });

    it('debería rechazar si la invitación no existe', async () => {
      req.body = { codigo: 'CODIGO-INVALIDO' };

      Invitacion.findOne.mockResolvedValue(null);

      await aceptarInvitacion(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invitación no encontrada.'
      });
    });

    it('debería rechazar si la invitación ya fue usada', async () => {
      req.body = { codigo: 'JOIN-ABC123' };

      const mockInvitacion = {
        id: 1,
        codigo: 'JOIN-ABC123',
        usado: true
      };

      Invitacion.findOne.mockResolvedValue(mockInvitacion);

      await aceptarInvitacion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La invitación ya ha sido utilizada.'
      });
    });

    it('debería rechazar si el vehículo no existe', async () => {
      req.body = { codigo: 'JOIN-ABC123' };

      const mockInvitacion = {
        id: 1,
        vehiculoId: 999,
        codigo: 'JOIN-ABC123',
        usado: false
      };

      Invitacion.findOne.mockResolvedValue(mockInvitacion);
      Vehiculo.findByPk.mockResolvedValue(null);

      await aceptarInvitacion(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Vehículo no encontrado.'
      });
    });
  });

  describe('rechazarInvitacion', () => {
    it('debería rechazar una invitación exitosamente', async () => {
      req.body = {
        invitacionId: 1,
        usuarioId: 2
      };

      const mockInvitacion = {
        id: 1,
        usuarioInvitadoId: 2,
        usado: false,
        save: vi.fn()
      };

      Invitacion.findByPk.mockResolvedValue(mockInvitacion);

      await rechazarInvitacion(req, res);

      expect(mockInvitacion.usado).toBe(true);
      expect(mockInvitacion.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invitación rechazada y eliminada correctamente.'
      });
    });

    it('debería rechazar si la invitación no existe', async () => {
      req.body = {
        invitacionId: 999,
        usuarioId: 2
      };

      Invitacion.findByPk.mockResolvedValue(null);

      await rechazarInvitacion(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invitación no encontrada.'
      });
    });

    it('debería rechazar si el usuario no tiene permiso', async () => {
      req.body = {
        invitacionId: 1,
        usuarioId: 3
      };

      const mockInvitacion = {
        id: 1,
        usuarioInvitadoId: 2,
        usado: false
      };

      Invitacion.findByPk.mockResolvedValue(mockInvitacion);

      await rechazarInvitacion(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No tienes permiso para rechazar esta invitación.'
      });
    });
  });

  describe('obtenerInvitacionesRecibidas', () => {
    it('debería obtener las invitaciones recibidas de un usuario', async () => {
      req.params = { usuarioId: '2' };

      const mockUsuario = {
        id: 2,
        email: 'user@example.com'
      };

      const mockInvitaciones = [
        {
          id: 1,
          vehiculoId: 1,
          usuarioInvitadoId: 2,
          usado: false,
          Vehiculo: {
            id: 1,
            nombre: 'Tesla Model S',
            matricula: '1234ABC'
          }
        }
      ];

      Usuario.findByPk.mockResolvedValue(mockUsuario);
      Invitacion.findAll.mockResolvedValue(mockInvitaciones);

      await obtenerInvitacionesRecibidas(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        invitaciones: mockInvitaciones
      });
    });

    it('debería rechazar si el usuario no existe', async () => {
      req.params = { usuarioId: '999' };

      Usuario.findByPk.mockResolvedValue(null);

      await obtenerInvitacionesRecibidas(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado.'
      });
    });
  });
});