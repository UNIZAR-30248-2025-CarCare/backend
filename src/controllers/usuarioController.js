import Usuario from "../models/Usuario.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Función para registrar un nuevo usuario
export const sign_up = async (req, res) => {
  try {
    const { nombre, email, contraseña, fecha_nacimiento } = req.body;

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ error: "El email ya está registrado." });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const contraseñaHasheada = await bcrypt.hash(contraseña, salt);

    // Crear el nuevo usuario
    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      contraseña: contraseñaHasheada,
      fecha_nacimiento
    });

    res.status(200).json({ message: "Usuario registrado exitosamente.", usuario: nuevoUsuario });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar el usuario.", detalles: error.message });
  }
};

// Función para autenticar a un usuario
export const sign_in = async (req, res) => {
  try {
    const { email, contraseña } = req.body;

    // Verificar si el usuario existe
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // Verificar la contraseña
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!contraseñaValida) {
      return res.status(401).json({ error: "Contraseña incorrecta." });
    }

    // Generar un token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET || "secret_key", // Usa una clave secreta desde el .env
      { expiresIn: "1h" } // El token expira en 1 hora
    );

    res.status(200).json({ message: "Inicio de sesión exitoso.", token });
  } catch (error) {
    res.status(500).json({ error: "Error al iniciar sesión.", detalles: error.message });
  }
};