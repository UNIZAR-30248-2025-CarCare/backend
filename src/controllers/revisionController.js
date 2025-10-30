import Revision from "../models/Revision.js";
import Vehiculo from "../models/Vehiculo.js";
import Usuario from "../models/Usuario.js";
import sequelize from "../config/database.js";

// Crear una revisión
export const registrarRevision = async (req, res) => {
  try {
    const {
      usuarioId,
      vehiculoId,
      fecha,
      tipo,
      kilometraje,
      observaciones,
      proximaRevision,
      taller
    } = req.body;

    // Comprobar que el usuario existe
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(400).json({ error: "El usuario no existe" });
    }

    // Comprobar que el vehículo existe
    const vehiculo = await Vehiculo.findByPk(vehiculoId);
    if (!vehiculo) {
      return res.status(400).json({ error: "El vehículo no existe" });
    }

    // Validaciones básicas de campos
    if (!tipo || typeof tipo !== "string") {
      return res.status(400).json({ error: "Tipo de revisión inválido" });
    }
    if (!observaciones || typeof observaciones !== "string") {
      return res.status(400).json({ error: "Observaciones inválidas" });
    }
    if (typeof kilometraje !== "number" || kilometraje < 0) {
      return res.status(400).json({ error: "Kilometraje inválido" });
    }

    // Crear la revisión
    const revision = await Revision.create({
      usuarioId,
      vehiculoId,
      fecha,
      tipo,
      kilometraje,
      observaciones,
      proximaRevision: proximaRevision || null,
      taller: taller || null
    });

    res.status(201).json({ revision });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar la revisión", detalles: error.message });
  }
};

// Obtener todas las revisiones de un vehículo
export const obtenerRevisiones = async (req, res) => {
  try {
    const { vehiculoId } = req.params;
    const { tipo } = req.query; // opcional

    // Validación básica
    if (!vehiculoId) {
      return res.status(400).json({ error: "vehiculoId es obligatorio" });
    }

    // Construir cláusula WHERE
    const whereClause = { vehiculoId };
    if (tipo) {
      whereClause.tipo = tipo;
    }

    // Obtener revisiones
    const revisiones = await Revision.findAll({
      where: whereClause,
      // Incluimos el usuario solo si la relación está definida
      include: Usuario ? [{ model: Usuario, attributes: ["nombre"] }] : [],
      order: [["fecha", "DESC"]],
    });

    // Mapear resultado y devolver solo lo necesario
    const result = revisiones.map(r => {
      const rev = r.toJSON();
      rev.usuario = rev.Usuario?.nombre || null;
      delete rev.usuarioId;
      delete rev.Usuario;
      return rev;
    });

    res.status(200).json({ revisiones: result });
  } catch (error) {
    console.error("❌ Error en obtenerRevisiones:", error);
    res.status(500).json({ error: "Error al obtener las revisiones", detalles: error.message });
  }
};


