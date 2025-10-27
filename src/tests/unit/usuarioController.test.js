import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sign_up, sign_in, obtenerNombreUsuario } from '../../controllers/usuarioController.js';
import Usuario from '../../models/Usuario.js';
import jwt from 'jsonwebtoken';

// Mock de los modelos
vi.mock('../../models/Usuario.js');
vi.mock('jsonwebtoken');

describe('Usuario Controller - Tests Unitarios', () => {
  let req, res;

  beforeEach(() => {
    // Reset de mocks
    vi.clearAllMocks();
    
    // Mock de request y response
    req = {
      body: {},
      params: {},
      usuario: {}
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  describe('sign_up', () => {
    it('debería registrar un usuario exitosamente', async () => {
      req.body = {
        nombre: 'Test User',
        email: 'test@example.com',
        contraseña: 'password123',
        fecha_nacimiento: '2000-01-01'
      };

      Usuario.findOne.mockResolvedValue(null);
      Usuario.create.mockResolvedValue({
        id: 1,
        nombre: 'Test User',
        email: 'test@example.com'
      });

      await sign_up(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Usuario registrado exitosamente.'
        })
      );
    });

    it('debería rechazar un email inválido', async () => {
      req.body = {
        nombre: 'Test User',
        email: 'invalid-email',
        contraseña: 'password123',
        fecha_nacimiento: '2000-01-01'
      };

      await sign_up(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El formato del email no es válido.'
      });
    });

    it('debería rechazar una fecha de nacimiento futura', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      req.body = {
        nombre: 'Test User',
        email: 'test@example.com',
        contraseña: 'password123',
        fecha_nacimiento: futureDate.toISOString().split('T')[0]
      };

      await sign_up(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La fecha de nacimiento no es válida o no cumple con la edad mínima requerida (16 años).'
      });
    });

    it('debería rechazar un usuario menor de 16 años', async () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 15);

      req.body = {
        nombre: 'Test User',
        email: 'test@example.com',
        contraseña: 'password123',
        fecha_nacimiento: date.toISOString().split('T')[0]
      };

      await sign_up(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'La fecha de nacimiento no es válida o no cumple con la edad mínima requerida (16 años).'
      });
    });

    it('debería rechazar un email ya registrado', async () => {
      req.body = {
        nombre: 'Test User',
        email: 'test@example.com',
        contraseña: 'password123',
        fecha_nacimiento: '2000-01-01'
      };

      Usuario.findOne.mockResolvedValue({ email: 'test@example.com' });

      await sign_up(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El email ya está registrado.'
      });
    });
  });

  describe('sign_in', () => {
    it('debería autenticar un usuario correctamente', async () => {
      req.body = {
        email: 'test@example.com',
        contraseña: 'password123'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        contrasegna: 'password123'
      };

      Usuario.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock-token');

      await sign_in(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Inicio de sesión exitoso.',
        token: 'mock-token',
        userId: 1
      });
    });

    it('debería rechazar un email inválido', async () => {
      req.body = {
        email: 'invalid-email',
        contraseña: 'password123'
      };

      await sign_in(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El formato del email no es válido.'
      });
    });

    it('debería rechazar un usuario no encontrado', async () => {
      req.body = {
        email: 'test@example.com',
        contraseña: 'password123'
      };

      Usuario.findOne.mockResolvedValue(null);

      await sign_in(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado.'
      });
    });

    it('debería rechazar una contraseña incorrecta', async () => {
      req.body = {
        email: 'test@example.com',
        contraseña: 'wrongpassword'
      };

      Usuario.findOne.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        contrasegna: 'password123'
      });

      await sign_in(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Contraseña incorrecta.'
      });
    });
  });

  describe('obtenerNombreUsuario', () => {
    it('debería obtener el nombre de usuario exitosamente', async () => {
      req.params = { id: '1' };
      req.usuario = { id: 1 };

      Usuario.findByPk.mockResolvedValue({
        id: 1,
        nombre: 'Test User'
      });

      await obtenerNombreUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        nombre: 'Test User'
      });
    });

    it('debería rechazar un ID no numérico', async () => {
      req.params = { id: 'abc' };
      req.usuario = { id: 1 };

      await obtenerNombreUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El ID debe ser un número.'
      });
    });

    it('debería rechazar un usuario no encontrado', async () => {
      req.params = { id: '999' };
      req.usuario = { id: 999 };

      Usuario.findByPk.mockResolvedValue(null);

      await obtenerNombreUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado.'
      });
    });

    it('debería rechazar acceso no autorizado', async () => {
      req.params = { id: '2' };
      req.usuario = { id: 1 };

      Usuario.findByPk.mockResolvedValue({
        id: 2,
        nombre: 'Other User'
      });

      await obtenerNombreUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No tienes permiso para acceder a esta información.'
      });
    });
  });
});