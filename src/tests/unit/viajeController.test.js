import { describe, it, expect, beforeEach, vi } from 'vitest';
import { crearViaje, obtenerViajes } from '../../controllers/viajeController.js';
import Viaje from '../../models/Viaje.js';
import Vehiculo from '../../models/Vehiculo.js';
import Usuario from '../../models/Usuario.js';

// Mock de los modelos
vi.mock('../../models/Viaje.js');
vi.mock('../../models/Vehiculo.js');
vi.mock('../../models/Usuario.js');

describe('Viaje Controller - Tests Unitarios', () => {
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

  describe('crearViaje', () => {
    const viajeValido = {
      usuarioId: 1,
      vehiculoId: 1,
      nombre: 'Viaje a Madrid',
      descripcion: 'Viaje de trabajo',
      fechaHoraInicio: '2025-10-28T08:00:00.000Z',
      fechaHoraFin: '2025-10-28T14:00:00.000Z',
      kmRealizados: 350.5,
      consumoCombustible: 25.5,
      ubicacionFinal: { latitud: 40.4168, longitud: -3.7038 }
    };

    it('debería crear un viaje exitosamente', async () => {
      req.body = viajeValido;

      Usuario.findByPk.mockResolvedValue({ id: 1, nombre: 'Test User' });
      Vehiculo.findByPk.mockResolvedValue({ id: 1, matricula: 'ABC123' });
      Viaje.create.mockResolvedValue({ id: 1, ...viajeValido });
      Vehiculo.update.mockResolvedValue([1]);

      await crearViaje(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          viaje: expect.objectContaining({
            nombre: 'Viaje a Madrid'
          })
        })
      );
    });

    it('debería rechazar si el usuario no existe', async () => {
      req.body = viajeValido;
      Usuario.findByPk.mockResolvedValue(null);

      await crearViaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El usuario no existe'
      });
    });

    it('debería rechazar si el vehículo no existe', async () => {
      req.body = viajeValido;
      Usuario.findByPk.mockResolvedValue({ id: 1 });
      Vehiculo.findByPk.mockResolvedValue(null);

      await crearViaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El vehículo no existe'
      });
    });

    it('debería rechazar nombre vacío', async () => {
      req.body = { ...viajeValido, nombre: '' };
      Usuario.findByPk.mockResolvedValue({ id: 1 });
      Vehiculo.findByPk.mockResolvedValue({ id: 1 });

      await crearViaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El nombre debe ser un string no vacío'
      });
    });

    it('debería rechazar descripción vacía', async () => {
      req.body = { ...viajeValido, descripcion: '   ' };
      Usuario.findByPk.mockResolvedValue({ id: 1 });
      Vehiculo.findByPk.mockResolvedValue({ id: 1 });

      await crearViaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La descripción debe ser un string no vacío'
      });
    });

    it('debería rechazar fecha de inicio mayor que fecha de fin', async () => {
      req.body = {
        ...viajeValido,
        fechaHoraInicio: '2025-10-28T14:00:00.000Z',
        fechaHoraFin: '2025-10-28T08:00:00.000Z'
      };
      Usuario.findByPk.mockResolvedValue({ id: 1 });
      Vehiculo.findByPk.mockResolvedValue({ id: 1 });

      await crearViaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La fecha de inicio no puede ser mayor que la de fin'
      });
    });

    it('debería rechazar fechas con formato inválido', async () => {
      req.body = {
        ...viajeValido,
        fechaHoraInicio: 'invalid-date'
      };
      Usuario.findByPk.mockResolvedValue({ id: 1 });
      Vehiculo.findByPk.mockResolvedValue({ id: 1 });

      await crearViaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Las fechas deben tener un formato válido'
      });
    });

    it('debería rechazar km realizados negativos o cero', async () => {
      req.body = { ...viajeValido, kmRealizados: 0 };
      Usuario.findByPk.mockResolvedValue({ id: 1 });
      Vehiculo.findByPk.mockResolvedValue({ id: 1 });

      await crearViaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Los km realizados deben ser un número mayor que 0'
      });
    });

    it('debería rechazar consumo de combustible negativo o cero', async () => {
      req.body = { ...viajeValido, consumoCombustible: -5 };
      Usuario.findByPk.mockResolvedValue({ id: 1 });
      Vehiculo.findByPk.mockResolvedValue({ id: 1 });

      await crearViaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El consumo de combustible debe ser un número mayor que 0'
      });
    });

    it('debería rechazar ubicación final sin latitud', async () => {
      req.body = {
        ...viajeValido,
        ubicacionFinal: { longitud: -3.7038 }
      };
      Usuario.findByPk.mockResolvedValue({ id: 1 });
      Vehiculo.findByPk.mockResolvedValue({ id: 1 });

      await crearViaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La ubicación final debe tener latitud y longitud numéricas'
      });
    });

    it('debería rechazar ubicación final con coordenadas no numéricas', async () => {
      req.body = {
        ...viajeValido,
        ubicacionFinal: { latitud: 'invalid', longitud: -3.7038 }
      };
      Usuario.findByPk.mockResolvedValue({ id: 1 });
      Vehiculo.findByPk.mockResolvedValue({ id: 1 });

      await crearViaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La ubicación final debe tener latitud y longitud numéricas'
      });
    });
  });

  describe('obtenerViajes', () => {
    it('debería obtener los viajes de un vehículo con nombre de usuario', async () => {
      req.params = { vehiculoId: '1' };

      const mockViajes = [
        {
          toJSON: () => ({
            id: 1,
            usuarioId: 1,
            vehiculoId: 1,
            nombre: 'Viaje a Madrid',
            Usuario: { nombre: 'Juan Pérez' }
          })
        },
        {
          toJSON: () => ({
            id: 2,
            usuarioId: 2,
            vehiculoId: 1,
            nombre: 'Viaje a Barcelona',
            Usuario: { nombre: 'Ana López' }
          })
        }
      ];

      Viaje.findAll.mockResolvedValue(mockViajes);

      await obtenerViajes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        viajes: expect.arrayContaining([
          expect.objectContaining({
            nombre: 'Viaje a Madrid',
            usuario: 'Juan Pérez'
          }),
          expect.objectContaining({
            nombre: 'Viaje a Barcelona',
            usuario: 'Ana López'
          })
        ])
      });
    });

    it('debería devolver array vacío si no hay viajes', async () => {
      req.params = { vehiculoId: '1' };
      Viaje.findAll.mockResolvedValue([]);

      await obtenerViajes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ viajes: [] });
    });

    it('debería manejar error en la consulta', async () => {
      req.params = { vehiculoId: '1' };
      Viaje.findAll.mockRejectedValue(new Error('Database error'));

      await obtenerViajes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener los viajes',
        detalles: 'Database error'
      });
    });
  });
});