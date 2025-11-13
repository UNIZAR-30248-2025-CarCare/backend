import { describe, it, expect, beforeEach, vi } from 'vitest';
import busquedaController from '../../controllers/busquedaController.js';
import BusquedaService from '../../services/BusquedaService.js';

// Mock del servicio
vi.mock('../../services/BusquedaService.js');

describe('Busqueda Controller - Tests Unitarios', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    
    req = {
      params: {},
      query: {},
      usuario: { id: 1 }
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  describe('busquedaGlobal', () => {
    it('debería realizar búsqueda global exitosamente', async () => {
      req.params = { vehiculoId: '1' };
      req.query = { query: 'Madrid' };

      const mockResultados = {
        viajes: [
          { id: 1, nombre: 'Viaje a Madrid', descripcion: 'Test' }
        ],
        reservas: [],
        revisiones: []
      };

      BusquedaService.busquedaGlobal.mockResolvedValue(mockResultados);

      await busquedaController.busquedaGlobal(req, res);

      expect(BusquedaService.busquedaGlobal).toHaveBeenCalledWith('1', 'Madrid', 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResultados);
    });

    it('debería rechazar búsqueda sin parámetro query', async () => {
      req.params = { vehiculoId: '1' };
      req.query = {};

      await busquedaController.busquedaGlobal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "El parámetro 'query' es requerido"
      });
    });

    it('debería rechazar búsqueda con query vacío', async () => {
      req.params = { vehiculoId: '1' };
      req.query = { query: '   ' };

      await busquedaController.busquedaGlobal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "El parámetro 'query' es requerido"
      });
    });

    it('debería manejar error cuando el vehículo no existe', async () => {
      req.params = { vehiculoId: '999' };
      req.query = { query: 'test' };

      BusquedaService.busquedaGlobal.mockRejectedValue(
        new Error('Vehículo no encontrado o sin acceso')
      );

      await busquedaController.busquedaGlobal(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Vehículo no encontrado o sin acceso'
      });
    });

    it('debería manejar errores del servicio', async () => {
      req.params = { vehiculoId: '1' };
      req.query = { query: 'test' };

      BusquedaService.busquedaGlobal.mockRejectedValue(
        new Error('Database error')
      );

      await busquedaController.busquedaGlobal(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });

    it('debería buscar con caracteres especiales en el query', async () => {
      req.params = { vehiculoId: '1' };
      req.query = { query: 'Shell & Co.' };

      const mockResultados = {
        viajes: [],
        reservas: [],
        revisiones: []
      };

      BusquedaService.busquedaGlobal.mockResolvedValue(mockResultados);

      await busquedaController.busquedaGlobal(req, res);

      expect(BusquedaService.busquedaGlobal).toHaveBeenCalledWith('1', 'Shell & Co.', 1);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});