import { describe, it, expect, beforeEach, vi } from 'vitest';
import { crearRepostaje, obtenerRepostajesVehiculo, calcularProximoRepostaje } from '../../controllers/repostajeController.js';
import Repostaje from '../../models/Repostaje.js';
import Vehiculo from '../../models/Vehiculo.js';
import Usuario from '../../models/Usuario.js';
import Viaje from '../../models/Viaje.js';

// Mock de los modelos
vi.mock('../../models/Repostaje.js');
vi.mock('../../models/Vehiculo.js');
vi.mock('../../models/Usuario.js');
vi.mock('../../models/Viaje.js');

describe('Repostaje Controller - Tests Unitarios', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    
    req = {
      body: {},
      params: {}
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  describe('crearRepostaje', () => {
    const repostajeValido = {
      usuarioId: 1,
      vehiculoId: 1,
      fecha: '2025-10-28T10:00:00.000Z',
      litros: 45.5,
      precioPorLitro: 1.5,
      precioTotal: 68.25
    };

    it('debería crear un repostaje exitosamente', async () => {
      req.body = repostajeValido;

      Usuario.findByPk.mockResolvedValue({ id: 1, nombre: 'Test User' });
      Vehiculo.findByPk.mockResolvedValue({ id: 1, matricula: 'ABC123' });
      Repostaje.create.mockResolvedValue({ id: 1, ...repostajeValido });

      await crearRepostaje(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          litros: 45.5,
          precioTotal: 68.25
        })
      );
    });

    it('debería rechazar si el usuario no existe', async () => {
      req.body = repostajeValido;
      Usuario.findByPk.mockResolvedValue(null);

      await crearRepostaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El usuario no existe'
      });
    });

    it('debería rechazar si el vehículo no existe', async () => {
      req.body = repostajeValido;
      Usuario.findByPk.mockResolvedValue({ id: 1 });
      Vehiculo.findByPk.mockResolvedValue(null);

      await crearRepostaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El vehículo no existe'
      });
    });

    it('debería rechazar fecha inválida', async () => {
      req.body = { ...repostajeValido, fecha: 'invalid-date' };
      Usuario.findByPk.mockResolvedValue({ id: 1 });
      Vehiculo.findByPk.mockResolvedValue({ id: 1 });

      await crearRepostaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La fecha no es válida'
      });
    });

    it('debería rechazar litros no numéricos', async () => {
      req.body = { ...repostajeValido, litros: 'invalid' };
      Usuario.findByPk.mockResolvedValue({ id: 1 });
      Vehiculo.findByPk.mockResolvedValue({ id: 1 });

      await crearRepostaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Los litros deben ser un número mayor que 0'
      });
    });

    it('debería rechazar litros negativos', async () => {
      req.body = { ...repostajeValido, litros: -10 };
      Usuario.findByPk.mockResolvedValue({ id: 1 });
      Vehiculo.findByPk.mockResolvedValue({ id: 1 });

      await crearRepostaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Los litros deben ser un número mayor que 0'
      });
    });

    it('debería rechazar litros igual a cero', async () => {
      req.body = { ...repostajeValido, litros: 0 };
      Usuario.findByPk.mockResolvedValue({ id: 1 });
      Vehiculo.findByPk.mockResolvedValue({ id: 1 });

      await crearRepostaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Los litros deben ser un número mayor que 0'
      });
    });

    it('debería rechazar precio por litro negativo', async () => {
      req.body = { ...repostajeValido, precioPorLitro: -1.5 };
      Usuario.findByPk.mockResolvedValue({ id: 1 });
      Vehiculo.findByPk.mockResolvedValue({ id: 1 });

      await crearRepostaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El precio por litro debe ser un número mayor que 0'
      });
    });

    it('debería rechazar precio total negativo', async () => {
      req.body = { ...repostajeValido, precioTotal: -50 };
      Usuario.findByPk.mockResolvedValue({ id: 1 });
      Vehiculo.findByPk.mockResolvedValue({ id: 1 });

      await crearRepostaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El precio total debe ser un número mayor que 0'
      });
    });
  });

  describe('obtenerRepostajesVehiculo', () => {
    it('debería obtener todos los repostajes de un vehículo con totales', async () => {
      req.params = { vehiculoId: '1' };

      const mockRepostajes = [
        { id: 1, litros: 45.5, precioTotal: 68.25 },
        { id: 2, litros: 50.0, precioTotal: 75.00 }
      ];

      Repostaje.findAll.mockResolvedValue(mockRepostajes);

      await obtenerRepostajesVehiculo(req, res);

      expect(res.json).toHaveBeenCalledWith({
        repostajes: mockRepostajes,
        totalLitros: 95.5,
        totalPrecio: 143.25
      });
    });

    it('debería devolver array vacío y totales en cero si no hay repostajes', async () => {
      req.params = { vehiculoId: '1' };
      Repostaje.findAll.mockResolvedValue([]);

      await obtenerRepostajesVehiculo(req, res);

      expect(res.json).toHaveBeenCalledWith({
        repostajes: [],
        totalLitros: 0,
        totalPrecio: 0
      });
    });

    it('debería manejar error en la consulta', async () => {
      req.params = { vehiculoId: '1' };
      Repostaje.findAll.mockRejectedValue(new Error('Database error'));

      await obtenerRepostajesVehiculo(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener repostajes',
        detalles: 'Database error'
      });
    });
  });

  describe('calcularProximoRepostaje', () => {
    it('debería calcular correctamente el próximo repostaje', async () => {
      req.params = { vehiculoId: '1' };

      const mockViajes = [
        { usuarioId: 1, kmRealizados: 100 },
        { usuarioId: 2, kmRealizados: 200 }
      ];

      const mockRepostajes = [
        { usuarioId: 1, precioTotal: 60 },
        { usuarioId: 2, precioTotal: 30 }
      ];

      Viaje.findAll.mockResolvedValue(mockViajes);
      Repostaje.findAll.mockResolvedValue(mockRepostajes);
      Usuario.findByPk.mockResolvedValue({ id: 2, nombre: 'Usuario 2', email: 'user2@test.com' });

      await calcularProximoRepostaje(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          proximoUsuario: expect.objectContaining({
            id: 2,
            nombre: 'Usuario 2'
          }),
          saldoPorUsuario: expect.any(Object),
          importeEstimado: 45
        })
      );
    });

    it('debería devolver importe estimado 0 si no hay repostajes previos', async () => {
      req.params = { vehiculoId: '1' };

      Viaje.findAll.mockResolvedValue([]);
      Repostaje.findAll.mockResolvedValue([]);

      await calcularProximoRepostaje(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          importeEstimado: 0
        })
      );
    });

    it('debería manejar error en la consulta', async () => {
      req.params = { vehiculoId: '1' };
      Viaje.findAll.mockRejectedValue(new Error('Database error'));

      await calcularProximoRepostaje(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al calcular el próximo repostaje',
        detalles: 'Database error'
      });
    });
  });
});