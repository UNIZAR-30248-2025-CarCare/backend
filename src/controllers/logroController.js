import Logro from "../models/Logro.js";
import UsuarioLogro from "../models/UsuarioLogro.js";
import Usuario from "../models/Usuario.js";
import Viaje from "../models/Viaje.js";
import Repostaje from "../models/Repostaje.js";
import Reserva from "../models/Reserva.js";

// Listar todos los logros disponibles
export const obtenerTodosLosLogros = async (req, res) => {
  try {
    const logros = await Logro.findAll({
      where: { activo: true },
      order: [['puntos', 'ASC'], ['nombre', 'ASC']]
    });

    res.status(200).json({ logros });
  } catch (error) {
    console.error("Error al obtener logros:", error);
    res.status(500).json({ error: "Error al obtener los logros" });
  }
};

// Obtener logros de un usuario con progreso
export const obtenerLogrosUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    if (req.usuario.id !== parseInt(usuarioId)) {
      return res.status(403).json({ error: "No tienes permisos para ver estos logros" });
    }

    const logrosUsuario = await UsuarioLogro.findAll({
      where: { usuarioId },
      include: [{
        model: Logro,
        attributes: ['id', 'nombre', 'descripcion', 'tipo', 'criterio', 'icono', 'puntos']
      }]
    });

    const todosLosLogros = await Logro.findAll({ where: { activo: true } });

    const logrosCompletos = todosLosLogros.map(logro => {
      const logroUsuario = logrosUsuario.find(ul => ul.logroId === logro.id);
      
      return {
        id: logro.id,
        nombre: logro.nombre,
        descripcion: logro.descripcion,
        tipo: logro.tipo,
        criterio: logro.criterio,
        icono: logro.icono,
        puntos: logro.puntos,
        progreso: logroUsuario ? logroUsuario.progreso : 0,
        desbloqueado: logroUsuario ? logroUsuario.desbloqueado : false,
        fechaObtenido: logroUsuario ? logroUsuario.fechaObtenido : null,
        porcentaje: logro.criterio > 0 ? Math.min(100, Math.round((logroUsuario?.progreso || 0) / logro.criterio * 100)) : 0
      };
    });

    const desbloqueados = logrosCompletos.filter(l => l.desbloqueado).length;
    const puntosTotales = logrosCompletos
      .filter(l => l.desbloqueado)
      .reduce((total, l) => total + l.puntos, 0);

    res.status(200).json({
      logros: logrosCompletos,
      estadisticas: {
        totalLogros: todosLosLogros.length,
        desbloqueados,
        pendientes: todosLosLogros.length - desbloqueados,
        puntosTotales,
        porcentajeCompletado: todosLosLogros.length > 0 ? Math.round((desbloqueados / todosLosLogros.length) * 100) : 0
      }
    });
  } catch (error) {
    console.error("Error al obtener logros del usuario:", error);
    res.status(500).json({ error: "Error al obtener los logros del usuario" });
  }
};

// Verificar y actualizar progreso de logros
export const verificarProgreso = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    if (req.usuario.id !== parseInt(usuarioId)) {
      return res.status(403).json({ error: "No tienes permisos" });
    }

    const logrosDesbloqueados = [];
    const todosLosLogros = await Logro.findAll({ where: { activo: true } });

    for (const logro of todosLosLogros) {
      const progresoActual = await calcularProgreso(usuarioId, logro.tipo);
      
      const [usuarioLogro, created] = await UsuarioLogro.findOrCreate({
        where: {
          usuarioId,
          logroId: logro.id
        },
        defaults: {
          progreso: progresoActual,
          desbloqueado: progresoActual >= logro.criterio,
          fechaObtenido: progresoActual >= logro.criterio ? new Date() : null
        }
      });

      if (!created) {
        const yaEstabaDesbloqueado = usuarioLogro.desbloqueado;
        
        usuarioLogro.progreso = progresoActual;
        
        if (progresoActual >= logro.criterio && !yaEstabaDesbloqueado) {
          usuarioLogro.desbloqueado = true;
          usuarioLogro.fechaObtenido = new Date();
          
          logrosDesbloqueados.push({
            id: logro.id,
            nombre: logro.nombre,
            descripcion: logro.descripcion,
            icono: logro.icono,
            puntos: logro.puntos,
            progreso: progresoActual
          });
        }
        
        await usuarioLogro.save();
      } else if (created && usuarioLogro.desbloqueado) {
        logrosDesbloqueados.push({
          id: logro.id,
          nombre: logro.nombre,
          descripcion: logro.descripcion,
          icono: logro.icono,
          puntos: logro.puntos,
          progreso: progresoActual
        });
      }
    }

    res.status(200).json({
      mensaje: "Progreso actualizado exitosamente",
      nuevosLogros: logrosDesbloqueados,
      totalNuevos: logrosDesbloqueados.length
    });
  } catch (error) {
    console.error("Error al verificar progreso:", error);
    res.status(500).json({ error: "Error al verificar el progreso" });
  }
};

// Calcular progreso según tipo de logro
async function calcularProgreso(usuarioId, tipo) {
  try {
    switch (tipo) {
      case 'DISTANCIA': {
        const viajes = await Viaje.findAll({
          where: { usuarioId },
          attributes: ['kilometros']
        });
        return Math.floor(viajes.reduce((total, v) => total + (parseFloat(v.kilometros) || 0), 0));
      }
      case 'REPOSTAJES':
        return await Repostaje.count({ where: { usuarioId } });
      case 'VIAJES':
        return await Viaje.count({ where: { usuarioId } });
      case 'RESERVAS':
        return await Reserva.count({ where: { UsuarioId: usuarioId } });
      case 'VEHICULOS': {
        const usuario = await Usuario.findByPk(usuarioId);
        return await usuario.countVehiculos();
      }
      default:
        return 0;
    }
  } catch (error) {
    console.error(`Error calculando progreso ${tipo}:`, error);
    return 0;
  }
}