import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registrarVehiculo, obtenerVehiculosUsuario, obtenerUbicacionVehiculo, actualizarUbicacionVehiculo } from '../../controllers/vehiculoController.js';

// Mock de los modelos ANTES de importarlos
vi.mock('../../models/Vehiculo.js', () => ({
  default: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn()
  }
}));

vi.mock('../../models/index.js', () => ({
  Usuario: {
    findByPk: vi.fn()
  },
  Vehiculo: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn()
  }
}));

// Importar los modelos mockeados
import Vehiculo from '../../models/Vehiculo.js';
import { Usuario } from '../../models/index.js';

describe('Vehiculo Controller - Tests Unitarios', () => {
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

  describe('registrarVehiculo', () => {
    it('debería registrar un vehículo exitosamente', async () => {
      req.body = {
        usuarioId: 1,
        nombre: 'Mi Coche',
        matricula: '1234ABC',
        modelo: 'Model S',
        fabricante: 'Tesla',
        antiguedad: 2,
        tipo_combustible: 'Eléctrico',
        litros_combustible: 0,
        consumo_medio: 0,
        ubicacion_actual: { lat: 40.4168, lng: -3.7038 },
        estado: 'Activo',
        tipo: 'Coche'
      };

      const mockUsuario = {
        id: 1,
        addVehiculo: vi.fn()
      };

      const mockVehiculo = {
        id: 1,
        nombre: 'Mi Coche',
        matricula: '1234ABC'
      };

      Usuario.findByPk.mockResolvedValue(mockUsuario);
      Vehiculo.findOne.mockResolvedValue(null);
      Vehiculo.create.mockResolvedValue(mockVehiculo);

      await registrarVehiculo(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Vehículo registrado exitosamente.'
        })
      );
    });

    it('debería rechazar si faltan campos obligatorios', async () => {
      req.body = {
        usuarioId: 1,
        nombre: 'Mi Coche'
      };

      await registrarVehiculo(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Faltan campos obligatorios.'
      });
    });

    it('debería rechazar tipo de combustible no válido', async () => {
      req.body = {
        usuarioId: 1,
        nombre: 'Mi Coche',
        matricula: '1234ABC',
        modelo: 'Model S',
        fabricante: 'Tesla',
        antiguedad: 2,
        tipo_combustible: 'Nuclear',
        consumo_medio: 0
      };

      await registrarVehiculo(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Tipo de combustible no válido.'
      });
    });

    it('debería rechazar estado no válido', async () => {
      req.body = {
        usuarioId: 1,
        nombre: 'Mi Coche',
        matricula: '1234ABC',
        modelo: 'Model S',
        fabricante: 'Tesla',
        antiguedad: 2,
        tipo_combustible: 'Eléctrico',
        consumo_medio: 0,
        estado: 'Destruido'
      };

      await registrarVehiculo(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Estado no válido.'
      });
    });

    it('debería rechazar tipo de vehículo no válido', async () => {
      req.body = {
        usuarioId: 1,
        nombre: 'Mi Coche',
        matricula: '1234ABC',
        modelo: 'Model S',
        fabricante: 'Tesla',
        antiguedad: 2,
        tipo_combustible: 'Eléctrico',
        consumo_medio: 0,
        tipo: 'Avión'
      };

      await registrarVehiculo(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Tipo de vehículo no válido.'
      });
    });

    it('debería rechazar matrícula duplicada', async () => {
      req.body = {
        usuarioId: 1,
        nombre: 'Mi Coche',
        matricula: '1234ABC',
        modelo: 'Model S',
        fabricante: 'Tesla',
        antiguedad: 2,
        tipo_combustible: 'Eléctrico',
        consumo_medio: 0
      };

      Vehiculo.findOne.mockResolvedValue({ matricula: '1234ABC' });

      await registrarVehiculo(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La matrícula ya está registrada.'
      });
    });

    it('debería rechazar si el usuario no existe', async () => {
      req.body = {
        usuarioId: 999,
        nombre: 'Mi Coche',
        matricula: '1234ABC',
        modelo: 'Model S',
        fabricante: 'Tesla',
        antiguedad: 2,
        tipo_combustible: 'Eléctrico',
        consumo_medio: 0
      };

      Usuario.findByPk.mockResolvedValue(null);
      Vehiculo.findOne.mockResolvedValue(null);

      await registrarVehiculo(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado.'
      });
    });
  });

  describe('obtenerVehiculosUsuario', () => {
    it('debería obtener los vehículos de un usuario', async () => {
      req.params = { usuarioId: '1' };

      const mockUsuario = {
        id: 1,
        getVehiculos: vi.fn().mockResolvedValue([
          {
            id: 1,
            nombre: 'Mi Coche',
            matricula: '1234ABC',
            Usuarios: [{ nombre: 'Usuario Test' }],
            toJSON: () => ({
              id: 1,
              nombre: 'Mi Coche',
              matricula: '1234ABC',
              Usuarios: [{ nombre: 'Usuario Test' }]
            })
          }
        ])
      };

      Usuario.findByPk.mockResolvedValue(mockUsuario);

      await obtenerVehiculosUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          vehiculos: expect.any(Array)
        })
      );
    });

    it('debería rechazar si el usuario no existe', async () => {
      req.params = { usuarioId: '999' };

      Usuario.findByPk.mockResolvedValue(null);

      await obtenerVehiculosUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado.'
      });
    });
  });

  describe('obtenerUbicacionVehiculo', () => {
    it('debería obtener la ubicación de un vehículo', async () => {
      req.params = { vehiculoId: '1' };
      req.usuario = { id: 1 };

      const mockVehiculo = {
        id: 1,
        ubicacion_actual: { lat: 40.4168, lng: -3.7038 },
        Usuarios: [{ id: 1 }]
      };

      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);

      await obtenerUbicacionVehiculo(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ubicacion_actual: { lat: 40.4168, lng: -3.7038 }
      });
    });

    it('debería rechazar si el vehículo no existe', async () => {
      req.params = { vehiculoId: '999' };
      req.usuario = { id: 1 };

      Vehiculo.findByPk.mockResolvedValue(null);

      await obtenerUbicacionVehiculo(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Vehículo no encontrado.'
      });
    });

    it('debería rechazar si el usuario no está vinculado al vehículo', async () => {
      req.params = { vehiculoId: '1' };
      req.usuario = { id: 2 };

      const mockVehiculo = {
        id: 1,
        ubicacion_actual: { lat: 40.4168, lng: -3.7038 },
        Usuarios: [{ id: 1 }]
      };

      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);

      await obtenerUbicacionVehiculo(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No tienes permisos para ver la ubicación de este vehículo.'
      });
    });
  });

  describe('actualizarUbicacionVehiculo', () => {
    it('debería actualizar la ubicación de un vehículo', async () => {
      req.params = { vehiculoId: '1' };
      req.usuario = { id: 1 };
      req.body = { ubicacion_actual: { lat: 41.3851, lng: 2.1734 } };

      const mockVehiculo = {
        id: 1,
        ubicacion_actual: { lat: 40.4168, lng: -3.7038 },
        Usuarios: [{ id: 1 }],
        save: vi.fn()
      };

      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);

      await actualizarUbicacionVehiculo(req, res);

      expect(mockVehiculo.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Ubicación actualizada correctamente.'
        })
      );
    });

    it('debería rechazar si el vehículo no existe', async () => {
      req.params = { vehiculoId: '999' };
      req.usuario = { id: 1 };
      req.body = { ubicacion_actual: { lat: 41.3851, lng: 2.1734 } };

      Vehiculo.findByPk.mockResolvedValue(null);

      await actualizarUbicacionVehiculo(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Vehículo no encontrado.'
      });
    });

    it('debería rechazar si el usuario no está vinculado al vehículo', async () => {
      req.params = { vehiculoId: '1' };
      req.usuario = { id: 2 };
      req.body = { ubicacion_actual: { lat: 41.3851, lng: 2.1734 } };

      const mockVehiculo = {
        id: 1,
        ubicacion_actual: { lat: 40.4168, lng: -3.7038 },
        Usuarios: [{ id: 1 }]
      };

      Vehiculo.findByPk.mockResolvedValue(mockVehiculo);

      await actualizarUbicacionVehiculo(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No tienes permisos para actualizar la ubicación de este vehículo.'
      });
    });
  });
});