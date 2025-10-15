import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
  try {
    // Obtener el token del header de la petición
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    
    // Añadir la información del usuario decodificada a la petición
    req.usuario = decoded;
    
    // Continuar con la ejecución
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};