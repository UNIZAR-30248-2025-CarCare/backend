import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registrar, listar, actualizar, eliminar } from '../../controllers/reservaController.js';

// Mock de los modelos
vi.mock('../../models/Vehiculo.js', () => ({
  default: {
    findByPk: vi.fn()
  }
}));

vi.mock('../../models/Usuario.js', () => ({
  default: {
    findByPk: vi.fn()
  }
}));

vi.mock('../../models/Reserva.js', () => ({
  default: {
    create: vi.fn(),
    findByPk: vi.fn(),
    findAll: vi.fn()
  }
}));

// Importar los modelos mockeados
import Vehiculo from '../../models/Vehiculo.js';
import Usuario from '../../models/Usuario.js';
import Reserva from '../../models/Reserva.js';

describe('Reserva Controller - Tests Unitarios', () => {
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

  describe('registrar', () => {
    it('debería crear una reserva exitosamente', async () => {
      req.body = {
        tipo: 'TRABAJO',
        fechaInicio: '2026-10-30',
        fechaFinal: '2026-10-31',
        vehiculoId: 1,
        horaInicio: '08:00:00',
        horaFin: '18:00:00',
        notas: 'Viaje de negocios'
      };

      const mockUsuario = {
        id: 1,
        nombre: 'Juan Pérez',
        email: 'juan@example.com'
      };

      const mockVehiculo = {
        id: 1,
        nombre: 'Tesla Model S',
        matricula: '1234ABC',
        disponible: true,
        hasUsuario: vi.fn().mockResolvedValue(true)
      };

      const mockReserva = {
        id: 1,
        motivo: 'TRABAJO',
        fechaInicio: '2026-10-30',
        fechaFin: '2026-10-31',
        UsuarioId: 1,
        VehiculoId: 1,
        horaInicio: '08:00:00',
        horaFin: '18:00:00',
        descripcion: 'Viaje de negocios'
      };

      Usuario.findByPk.mockResolvedValue(mockUsuario);
      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);
      Reserva.create.mockResolvedValue(mockReserva);

      await registrar(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Reserva creada exitosamente',
          reserva: expect.objectContaining({
            id: 1,
            motivo: 'TRABAJO',
            UsuarioId: 1,
            VehiculoId: 1
          })
        })
      );
    });

    it('debería rechazar si el usuario no existe', async () => {
      req.body = {
        tipo: 'TRABAJO',
        fechaInicio: '2026-10-30',
        fechaFinal: '2026-10-31',
        vehiculoId: 1,
        horaInicio: '08:00:00',
        horaFin: '18:00:00'
      };

      Usuario.findByPk.mockResolvedValue(null);

      await registrar(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado.'
      });
    });

    it('debería rechazar si el vehículo no existe', async () => {
      req.body = {
        tipo: 'TRABAJO',
        fechaInicio: '2026-10-30',
        fechaFinal: '2026-10-31',
        vehiculoId: 999,
        horaInicio: '08:00:00',
        horaFin: '18:00:00'
      };

      const mockUsuario = {
        id: 1,
        nombre: 'Juan Pérez'
      };

      Usuario.findByPk.mockResolvedValue(mockUsuario);
      Vehiculo.findByPk.mockResolvedValue(null);

      await registrar(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Vehículo no encontrado.'
      });
    });

    it('debería rechazar si el vehículo no está disponible', async () => {
      req.body = {
        tipo: 'TRABAJO',
        fechaInicio: '2026-10-30',
        fechaFinal: '2026-10-31',
        vehiculoId: 1,
        horaInicio: '08:00:00',
        horaFin: '18:00:00'
      };

      const mockUsuario = {
        id: 1,
        nombre: 'Juan Pérez'
      };

      const mockVehiculo = {
        id: 1,
        nombre: 'Tesla Model S',
        disponible: false
      };

      Usuario.findByPk.mockResolvedValue(mockUsuario);
      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);

      await registrar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El vehículo no está disponible para reservas.'
      });
    });

    it('debería rechazar si el usuario no tiene permisos sobre el vehículo', async () => {
      req.body = {
        tipo: 'TRABAJO',
        fechaInicio: '2026-10-30',
        fechaFinal: '2026-10-31',
        vehiculoId: 1,
        horaInicio: '08:00:00',
        horaFin: '18:00:00'
      };

      const mockUsuario = {
        id: 1,
        nombre: 'Juan Pérez'
      };

      const mockVehiculo = {
        id: 1,
        nombre: 'Tesla Model S',
        disponible: true,
        hasUsuario: vi.fn().mockResolvedValue(false)
      };

      Usuario.findByPk.mockResolvedValue(mockUsuario);
      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);

      await registrar(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No tienes permisos para reservar este vehículo.'
      });
    });

    it('debería manejar errores de validación del modelo', async () => {
      req.body = {
        tipo: 'TRABAJO',
        fechaInicio: '2026-10-30',
        fechaFinal: '2026-10-29', // Fecha final anterior a la inicial
        vehiculoId: 1,
        horaInicio: '08:00:00',
        horaFin: '18:00:00'
      };

      const mockUsuario = {
        id: 1,
        nombre: 'Juan Pérez'
      };

      const mockVehiculo = {
        id: 1,
        nombre: 'Tesla Model S',
        disponible: true,
        hasUsuario: vi.fn().mockResolvedValue(true)
      };

      Usuario.findByPk.mockResolvedValue(mockUsuario);
      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);
      Reserva.create.mockRejectedValue(new Error('La fecha de fin debe ser igual o posterior a la fecha de inicio.'));

      await registrar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La fecha de fin debe ser igual o posterior a la fecha de inicio.'
      });
    });
  });

  describe('listar', () => {
    it('debería listar todas las reservas de un usuario', async () => {
      const mockReservas = [
        {
          id: 1,
          motivo: 'TRABAJO',
          fechaInicio: '2026-10-30',
          fechaFin: '2026-10-31',
          UsuarioId: 1,
          VehiculoId: 1,
          Usuario: {
            id: 1,
            nombre: 'Juan Pérez',
            email: 'juan@example.com'
          },
          Vehiculo: {
            id: 1,
            nombre: 'Tesla Model S',
            matricula: '1234ABC',
            tipo: 'ELECTRICO'
          }
        },
        {
          id: 2,
          motivo: 'PERSONAL',
          fechaInicio: '2026-11-01',
          fechaFin: '2026-11-02',
          UsuarioId: 1,
          VehiculoId: 1,
          Usuario: {
            id: 1,
            nombre: 'Juan Pérez',
            email: 'juan@example.com'
          },
          Vehiculo: {
            id: 1,
            nombre: 'Tesla Model S',
            matricula: '1234ABC',
            tipo: 'ELECTRICO'
          }
        }
      ];

      Reserva.findAll.mockResolvedValue(mockReservas);

      await listar(req, res);

      expect(res.json).toHaveBeenCalledWith({
        reservas: mockReservas
      });
      expect(Reserva.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { UsuarioId: 1 }
        })
      );
    });

    it('debería devolver un array vacío si no hay reservas', async () => {
      Reserva.findAll.mockResolvedValue([]);

      await listar(req, res);

      expect(res.json).toHaveBeenCalledWith({
        reservas: []
      });
    });

    it('debería manejar errores al listar reservas', async () => {
      Reserva.findAll.mockRejectedValue(new Error('Error de base de datos'));

      await listar(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error de base de datos'
      });
    });
  });

  describe('actualizar', () => {
    it('debería actualizar una reserva exitosamente', async () => {
      req.params = { id: '1' };
      req.body = {
        motivo: 'PERSONAL',
        fechaInicio: '2026-10-30',
        fechaFin: '2026-10-31',
        horaInicio: '09:00:00',
        horaFin: '19:00:00',
        descripcion: 'Actualizada'
      };

      const mockReserva = {
        id: 1,
        UsuarioId: 1,
        motivo: 'TRABAJO',
        fechaInicio: '2026-10-30',
        fechaFin: '2026-10-31',
        horaInicio: '08:00:00',
        horaFin: '18:00:00',
        descripcion: 'Original',
        save: vi.fn().mockResolvedValue(true)
      };

      Reserva.findByPk.mockResolvedValue(mockReserva);

      await actualizar(req, res);

      expect(mockReserva.motivo).toBe('PERSONAL');
      expect(mockReserva.horaInicio).toBe('09:00:00');
      expect(mockReserva.descripcion).toBe('Actualizada');
      expect(mockReserva.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Reserva actualizada exitosamente'
        })
      );
    });

    it('debería rechazar si la reserva no existe', async () => {
      req.params = { id: '999' };
      req.body = {
        motivo: 'PERSONAL'
      };

      Reserva.findByPk.mockResolvedValue(null);

      await actualizar(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Reserva no encontrada.'
      });
    });

    it('debería rechazar si el usuario no es el propietario de la reserva', async () => {
      req.params = { id: '1' };
      req.body = {
        motivo: 'PERSONAL'
      };

      const mockReserva = {
        id: 1,
        UsuarioId: 2, // Diferente al usuario del request (id: 1)
        motivo: 'TRABAJO'
      };

      Reserva.findByPk.mockResolvedValue(mockReserva);

      await actualizar(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No tienes permisos para modificar esta reserva.'
      });
    });

    it('debería manejar errores de validación al actualizar', async () => {
      req.params = { id: '1' };
      req.body = {
        fechaInicio: '2026-10-30',
        fechaFin: '2026-10-29' // Fecha inválida
      };

      const mockReserva = {
        id: 1,
        UsuarioId: 1,
        motivo: 'TRABAJO',
        save: vi.fn().mockRejectedValue(new Error('La fecha de fin debe ser igual o posterior a la fecha de inicio.'))
      };

      Reserva.findByPk.mockResolvedValue(mockReserva);

      await actualizar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La fecha de fin debe ser igual o posterior a la fecha de inicio.'
      });
    });
  });

  describe('eliminar', () => {
    it('debería eliminar una reserva exitosamente', async () => {
      req.params = { id: '1' };

      const mockReserva = {
        id: 1,
        UsuarioId: 1,
        motivo: 'TRABAJO',
        destroy: vi.fn().mockResolvedValue(true)
      };

      Reserva.findByPk.mockResolvedValue(mockReserva);

      await eliminar(req, res);

      expect(mockReserva.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        mensaje: 'Reserva eliminada correctamente.'
      });
    });

    it('debería rechazar si la reserva no existe', async () => {
      req.params = { id: '999' };

      Reserva.findByPk.mockResolvedValue(null);

      await eliminar(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Reserva no encontrada.'
      });
    });

    it('debería rechazar si el usuario no es el propietario de la reserva', async () => {
      req.params = { id: '1' };

      const mockReserva = {
        id: 1,
        UsuarioId: 2, // Diferente al usuario del request (id: 1)
        motivo: 'TRABAJO'
      };

      Reserva.findByPk.mockResolvedValue(mockReserva);

      await eliminar(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No tienes permisos para eliminar esta reserva.'
      });
    });

    it('debería manejar errores al eliminar', async () => {
      req.params = { id: '1' };

      const mockReserva = {
        id: 1,
        UsuarioId: 1,
        destroy: vi.fn().mockRejectedValue(new Error('Error de base de datos'))
      };

      Reserva.findByPk.mockResolvedValue(mockReserva);

      await eliminar(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error de base de datos'
      });
    });
  });
});