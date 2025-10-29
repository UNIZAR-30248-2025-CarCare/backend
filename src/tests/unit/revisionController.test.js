import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registrarRevision, obtenerRevisiones } from '../../controllers/revisionController.js';
import Revision from '../../models/Revision.js';
import Usuario from '../../models/Usuario.js';
import Vehiculo from '../../models/Vehiculo.js';
import sequelize from '../../config/database.js';

// Mock de los modelos y de sequelize.query
vi.mock('../../models/Revision.js');
vi.mock('../../models/Usuario.js');
vi.mock('../../models/Vehiculo.js');
vi.mock('../../config/database.js', () => ({
  default: {
    query: vi.fn(),
    QueryTypes: { SELECT: 'SELECT' }
  }
}));

describe('Revision Controller - Tests Unitarios', () => {
    let req, res;

    beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {}, params: {}, query: {} };
    res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
    };
    });

    describe('registrarRevision', () => {
        const revisionValida = {
            usuarioId: 1,
            vehiculoId: 1,
            fecha: '2025-10-28T08:00:00.000Z',
            tipo: 'Aceite',
            kilometraje: 15000,
            observaciones: 'Cambio de aceite',
            proximaRevision: '2025-12-28T08:00:00.000Z',
            taller: 'Taller Pérez'
        };

        it('debería registrar una revisión correctamente', async () => {
            req.body = revisionValida;

            Usuario.findByPk.mockResolvedValue({ id: 1 });
            Vehiculo.findByPk.mockResolvedValue({ id: 1 });
            sequelize.query.mockResolvedValue([{ usuarioId: 1, vehiculoId: 1 }]);
            Revision.create.mockResolvedValue({ id: 1, ...revisionValida });

            await registrarRevision(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            revision: expect.objectContaining({ tipo: 'Aceite' })
            }));
        });

        it('debería fallar si el usuario no existe', async () => {
            req.body = revisionValida;
            Usuario.findByPk.mockResolvedValue(null);

            await registrarRevision(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'El usuario no existe' });
        });

        it('debería fallar si el vehículo no existe', async () => {
            req.body = revisionValida;
            Usuario.findByPk.mockResolvedValue({ id: 1 });
            Vehiculo.findByPk.mockResolvedValue(null);

            await registrarRevision(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'El vehículo no existe' });
        });

        it('debería fallar si el usuario no es propietario del vehículo', async () => {
            req.body = revisionValida;
            Usuario.findByPk.mockResolvedValue({ id: 1 });
            Vehiculo.findByPk.mockResolvedValue({ id: 1 });
            sequelize.query.mockResolvedValue([]); // no hay relación en UsuarioVehiculo

            await registrarRevision(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
            error: 'No tienes permiso para registrar revisiones de este vehículo'
            });
        });

        it('debería fallar si el tipo no es válido', async () => {
            req.body = { ...revisionValida, tipo: '' };
            Usuario.findByPk.mockResolvedValue({ id: 1 });
            Vehiculo.findByPk.mockResolvedValue({ id: 1 });
            sequelize.query.mockResolvedValue([{ usuarioId: 1, vehiculoId: 1 }]);

            await registrarRevision(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Tipo de revisión inválido' });
        });

        it('debería fallar si las observaciones no son válidas', async () => {
            req.body = { ...revisionValida, observaciones: '' };
            Usuario.findByPk.mockResolvedValue({ id: 1 });
            Vehiculo.findByPk.mockResolvedValue({ id: 1 });
            sequelize.query.mockResolvedValue([{ usuarioId: 1, vehiculoId: 1 }]);

            await registrarRevision(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Observaciones inválidas' });
        });

        it('debería fallar si el kilometraje es negativo', async () => {
            req.body = { ...revisionValida, kilometraje: -5 };
            Usuario.findByPk.mockResolvedValue({ id: 1 });
            Vehiculo.findByPk.mockResolvedValue({ id: 1 });
            sequelize.query.mockResolvedValue([{ usuarioId: 1, vehiculoId: 1 }]);

            await registrarRevision(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Kilometraje inválido' });
        });
    });

    describe('obtenerRevisiones', () => {
        it('debería devolver todas las revisiones de un vehículo', async () => {
            req.params = { vehiculoId: '1' };
            const mockRevisiones = [
            { toJSON: () => ({ id: 1, tipo: 'Aceite', Usuario: { nombre: 'Juan' } }) },
            { toJSON: () => ({ id: 2, tipo: 'Frenos', Usuario: { nombre: 'Ana' } }) }
            ];
            Revision.findAll.mockResolvedValue(mockRevisiones);

            await obtenerRevisiones(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
            revisiones: expect.arrayContaining([
                expect.objectContaining({ tipo: 'Aceite', usuario: 'Juan' }),
                expect.objectContaining({ tipo: 'Frenos', usuario: 'Ana' })
            ])
            });
        });

        it('debería filtrar por tipo si se pasa query tipo', async () => {
            req.params = { vehiculoId: '1' };
            req.query = { tipo: 'Aceite' };
            const mockRevisiones = [
            { toJSON: () => ({ id: 1, tipo: 'Aceite', Usuario: { nombre: 'Juan' } }) }
            ];
            Revision.findAll.mockResolvedValue(mockRevisiones);

            await obtenerRevisiones(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
            revisiones: expect.arrayContaining([
                expect.objectContaining({
                    tipo: 'Aceite',
                    usuario: 'Juan'
                })
            ])
            });
        });

        it('debería manejar error en la consulta', async () => {
            req.params = { vehiculoId: '1' };
            Revision.findAll.mockRejectedValue(new Error('Database error'));

            await obtenerRevisiones(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Error al obtener las revisiones',
                detalles: 'Database error'
            });
        });
    });
});
