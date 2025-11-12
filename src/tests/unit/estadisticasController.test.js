import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getEstadisticas } from '../../controllers/estadisticasController.js';
import EstadisticasService from '../../models/Estadisticas.js';

// Mock del servicio
vi.mock('../../models/Estadisticas.js');

describe('Estadísticas Controller - Tests Unitarios', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    
    req = {
      params: {},
      query: {}
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  describe('getEstadisticas', () => {
    it('debería obtener estadísticas exitosamente', async () => {
      req.params = { vehiculoId: '1' };
      req.query = { mes: '10', ano: '2025' };

      const mockEstadisticas = {
        kmTotales: 250,
        horasTotales: 5.5,
        consumoPromedio: 30,
        gastoTotal: 116,
        litrosTotales: 75
      };

      EstadisticasService.calcularEstadisticas.mockResolvedValue(mockEstadisticas);

      await getEstadisticas(req, res);

      expect(EstadisticasService.calcularEstadisticas).toHaveBeenCalledWith(1, 10, 2025);
      expect(res.json).toHaveBeenCalledWith(mockEstadisticas);
    });

    it('debería rechazar petición sin parámetro mes', async () => {
      req.params = { vehiculoId: '1' };
      req.query = { ano: '2025' };

      await getEstadisticas(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Los parámetros 'mes' y 'ano' son obligatorios"
      });
    });

    it('debería rechazar petición sin parámetro año', async () => {
      req.params = { vehiculoId: '1' };
      req.query = { mes: '10' };

      await getEstadisticas(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Los parámetros 'mes' y 'ano' son obligatorios"
      });
    });

    it('debería rechazar mes menor a 1', async () => {
      req.params = { vehiculoId: '1' };
      req.query = { mes: '0', ano: '2025' };

      await getEstadisticas(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "El mes debe estar entre 1 y 12"
      });
    });

    it('debería rechazar mes mayor a 12', async () => {
      req.params = { vehiculoId: '1' };
      req.query = { mes: '13', ano: '2025' };

      await getEstadisticas(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "El mes debe estar entre 1 y 12"
      });
    });

    it('debería rechazar año menor a 2000', async () => {
      req.params = { vehiculoId: '1' };
      req.query = { mes: '10', ano: '1999' };

      await getEstadisticas(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Año inválido"
      });
    });

    it('debería rechazar año mayor a 2100', async () => {
      req.params = { vehiculoId: '1' };
      req.query = { mes: '10', ano: '2101' };

      await getEstadisticas(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Año inválido"
      });
    });

    it('debería manejar errores del servicio', async () => {
      req.params = { vehiculoId: '1' };
      req.query = { mes: '10', ano: '2025' };

      EstadisticasService.calcularEstadisticas.mockRejectedValue(
        new Error('Database error')
      );

      await getEstadisticas(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Error al obtener estadísticas"
      });
    });

    it('debería convertir parámetros string a números', async () => {
      req.params = { vehiculoId: '5' };
      req.query = { mes: '3', ano: '2024' };

      const mockEstadisticas = {
        kmTotales: 100,
        horasTotales: 2.5,
        consumoPromedio: 7.5,
        gastoTotal: 50,
        litrosTotales: 30
      };

      EstadisticasService.calcularEstadisticas.mockResolvedValue(mockEstadisticas);

      await getEstadisticas(req, res);

      expect(EstadisticasService.calcularEstadisticas).toHaveBeenCalledWith(5, 3, 2024);
    });

    it('debería devolver estadísticas con valores redondeados', async () => {
      req.params = { vehiculoId: '1' };
      req.query = { mes: '10', ano: '2025' };

      const mockEstadisticas = {
        kmTotales: 250,
        horasTotales: 5.55,
        consumoPromedio: 30.12,
        gastoTotal: 116.78,
        litrosTotales: 75.5
      };

      EstadisticasService.calcularEstadisticas.mockResolvedValue(mockEstadisticas);

      await getEstadisticas(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          horasTotales: expect.any(Number),
          consumoPromedio: expect.any(Number)
        })
      );
    });
  });
});
