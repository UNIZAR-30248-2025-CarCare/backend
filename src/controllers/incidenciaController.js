import { Incidencia, Vehiculo, Usuario } from "../models/index.js";

// Función para crear una nueva incidencia
export const crearIncidencia = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const {
      vehiculoId,
      tipo,
      prioridad,
      titulo,
      descripcion,
      fotos,
      compartirConGrupo
    } = req.body;

    console.log("Request Body:", req.body);

    // Validar campos obligatorios
    if (
      vehiculoId === undefined || vehiculoId === null ||
      tipo === undefined || tipo === null ||
      prioridad === undefined || prioridad === null ||
      titulo === undefined || titulo === null ||
      descripcion === undefined || descripcion === null
    ) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    // Validar tipo de incidencia
    const tiposValidos = ["AVERIA", "DAÑO", "OTRO"];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: "Tipo de incidencia no válido." });
    }

    // Validar prioridad
    const prioridadesValidas = ["ALTA", "MEDIA", "BAJA"];
    if (!prioridadesValidas.includes(prioridad)) {
      return res.status(400).json({ error: "Prioridad no válida." });
    }

    // Verificar que el vehículo existe
    const vehiculo = await Vehiculo.findByPk(vehiculoId, {
      include: [{
        model: Usuario,
        attributes: ['id'],
        through: { attributes: [] }
      }]
    });

    if (!vehiculo) {
      return res.status(404).json({ error: "Vehículo no encontrado." });
    }

    // Verificar que el usuario está asociado al vehículo
    const vinculado = vehiculo.Usuarios.some(u => u.id === usuarioId);
    if (!vinculado) {
      return res.status(403).json({ error: "No tienes permisos para crear incidencias en este vehículo." });
    }

    // Crear la nueva incidencia
    const nuevaIncidencia = await Incidencia.create({
      vehiculoId,
      usuarioId,
      tipo,
      prioridad,
      titulo,
      descripcion,
      fotos: fotos || [],
      compartirConGrupo: compartirConGrupo !== undefined ? compartirConGrupo : true,
      estado: "Pendiente",
      fechaCreacion: new Date()
    });

    res.status(200).json({
        message: "Incidencia creada exitosamente.", 
        incidencia: nuevaIncidencia 
    });
  } catch (error) {
    console.error('ERROR al crear incidencia:', error); // <-- Añade esto
    res.status(500).json({ 
      error: "Error al crear la incidencia.", 
      detalles: error.message || error.toString() // <-- Así ves el mensaje real
    });
  }
};

// Función para obtener todas las incidencias de un vehículo
export const obtenerIncidenciasVehiculo = async (req, res) => {
  try {
    const vehiculoId = req.params.vehiculoId;
    const usuarioId = req.usuario.id;

    // Verificar que el vehículo existe y el usuario tiene acceso
    const vehiculo = await Vehiculo.findByPk(vehiculoId, {
      include: [{
        model: Usuario,
        attributes: ['id'],
        through: { attributes: [] }
      }]
    });

    if (!vehiculo) {
      return res.status(404).json({ error: "Vehículo no encontrado." });
    }

    const vinculado = vehiculo.Usuarios.some(u => u.id === usuarioId);
    if (!vinculado) {
      return res.status(403).json({ error: "No tienes permisos para ver las incidencias de este vehículo." });
    }

    // Obtener incidencias del vehículo
    const incidencias = await Incidencia.findAll({
      where: { vehiculoId },
      include: [{
        model: Usuario,
        attributes: ['id', 'nombre', 'email']
      }],
      order: [['fechaCreacion', 'DESC']]
    });

    res.status(200).json({ incidencias });
  } catch (error) {
    res.status(500).json({ 
      error: "Error al obtener las incidencias.", 
      detalles: error.message 
    });
  }
};

// Función para obtener todas las incidencias de los vehículos del usuario
export const obtenerIncidenciasUsuario = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    // Obtener vehículos del usuario
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const vehiculos = await usuario.getVehiculos();
    const vehiculoIds = vehiculos.map(v => v.id);

    // Obtener incidencias de todos los vehículos del usuario
    const incidencias = await Incidencia.findAll({
      where: { 
        vehiculoId: vehiculoIds 
      },
      include: [
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: Vehiculo,
          attributes: ['id', 'nombre', 'matricula', 'modelo', 'fabricante']
        }
      ],
      order: [['fechaCreacion', 'DESC']]
    });

    res.status(200).json({ incidencias });
  } catch (error) {
    res.status(500).json({ 
      error: "Error al obtener las incidencias.", 
      detalles: error.message 
    });
  }
};

// Función para obtener una incidencia específica
export const obtenerIncidencia = async (req, res) => {
  try {
    const incidenciaId = req.params.incidenciaId;
    const usuarioId = req.usuario.id;

    const incidencia = await Incidencia.findByPk(incidenciaId, {
      include: [
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: Vehiculo,
          attributes: ['id', 'nombre', 'matricula', 'modelo', 'fabricante'],
          include: [{
            model: Usuario,
            attributes: ['id'],
            through: { attributes: [] }
          }]
        }
      ]
    });

    if (!incidencia) {
      return res.status(404).json({ error: "Incidencia no encontrada." });
    }

    // Verificar que el usuario está asociado al vehículo
    const vinculado = incidencia.Vehiculo.Usuarios.some(u => u.id === usuarioId);
    if (!vinculado) {
      return res.status(403).json({ error: "No tienes permisos para ver esta incidencia." });
    }

    res.status(200).json({ incidencia });
  } catch (error) {
    res.status(500).json({ 
      error: "Error al obtener la incidencia.", 
      detalles: error.message 
    });
  }
};

// Función para actualizar el estado de una incidencia
export const actualizarEstadoIncidencia = async (req, res) => {
  try {
    const incidenciaId = req.params.incidenciaId;
    const usuarioId = req.usuario.id;
    const { estado } = req.body;

    // Validar estado
    const estadosValidos = ["Pendiente", "En progreso", "Resuelta", "Cancelada"];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: "Estado no válido." });
    }

    const incidencia = await Incidencia.findByPk(incidenciaId, {
      include: [{
        model: Vehiculo,
        include: [{
          model: Usuario,
          attributes: ['id'],
          through: { attributes: [] }
        }]
      }]
    });

    if (!incidencia) {
      return res.status(404).json({ error: "Incidencia no encontrada." });
    }

    // Verificar que el usuario está asociado al vehículo
    const vinculado = incidencia.Vehiculo.Usuarios.some(u => u.id === usuarioId);
    if (!vinculado) {
      return res.status(403).json({ error: "No tienes permisos para actualizar esta incidencia." });
    }

    incidencia.estado = estado;
    
    // Si se marca como resuelta, guardar fecha de resolución
    if (estado === "Resuelta") {
      incidencia.fechaResolucion = new Date();
    }

    await incidencia.save();

    res.status(200).json({ 
      message: "Estado de incidencia actualizado correctamente.", 
      incidencia 
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Error al actualizar el estado.", 
      detalles: error.message 
    });
  }
};

// Función para actualizar una incidencia completa
export const actualizarIncidencia = async (req, res) => {
  try {
    const incidenciaId = req.params.incidenciaId;
    const usuarioId = req.usuario.id;
    const { tipo, prioridad, titulo, descripcion, fotos, compartirConGrupo, estado } = req.body;

    const incidencia = await Incidencia.findByPk(incidenciaId, {
      include: [{
        model: Vehiculo,
        include: [{
          model: Usuario,
          attributes: ['id'],
          through: { attributes: [] }
        }]
      }]
    });

    if (!incidencia) {
      return res.status(404).json({ error: "Incidencia no encontrada." });
    }

    // Verificar que el usuario está asociado al vehículo
    const vinculado = incidencia.Vehiculo.Usuarios.some(u => u.id === usuarioId);
    if (!vinculado) {
      return res.status(403).json({ error: "No tienes permisos para actualizar esta incidencia." });
    }

    // Validar tipo si se proporciona
    if (tipo) {
      const tiposValidos = ["Avería", "Daño", "Otro"];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({ error: "Tipo de incidencia no válido." });
      }
      incidencia.tipo = tipo;
    }

    // Validar prioridad si se proporciona
    if (prioridad) {
      const prioridadesValidas = ["Alta", "Media", "Baja"];
      if (!prioridadesValidas.includes(prioridad)) {
        return res.status(400).json({ error: "Prioridad no válida." });
      }
      incidencia.prioridad = prioridad;
    }

    // Validar estado si se proporciona
    if (estado) {
      const estadosValidos = ["Pendiente", "En progreso", "Resuelta", "Cancelada"];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ error: "Estado no válido." });
      }
      incidencia.estado = estado;
      
      if (estado === "Resuelta" && !incidencia.fechaResolucion) {
        incidencia.fechaResolucion = new Date();
      }
    }

    if (titulo !== undefined) incidencia.titulo = titulo;
    if (descripcion !== undefined) incidencia.descripcion = descripcion;
    if (fotos !== undefined) incidencia.fotos = fotos;
    if (compartirConGrupo !== undefined) incidencia.compartirConGrupo = compartirConGrupo;

    await incidencia.save();

    res.status(200).json({ 
      message: "Incidencia actualizada correctamente.", 
      incidencia 
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Error al actualizar la incidencia.", 
      detalles: error.message 
    });
  }
};

// Función para eliminar una incidencia
export const eliminarIncidencia = async (req, res) => {
  try {
    const incidenciaId = req.params.incidenciaId;
    const usuarioId = req.usuario.id;

    const incidencia = await Incidencia.findByPk(incidenciaId, {
      include: [{
        model: Vehiculo,
        include: [{
          model: Usuario,
          attributes: ['id'],
          through: { attributes: [] }
        }]
      }]
    });

    if (!incidencia) {
      return res.status(404).json({ error: "Incidencia no encontrada." });
    }

    // Verificar que el usuario está asociado al vehículo o es el creador
    const vinculado = incidencia.Vehiculo.Usuarios.some(u => u.id === usuarioId);
    const esCreador = incidencia.usuarioId === usuarioId;
    
    if (!vinculado && !esCreador) {
      return res.status(403).json({ error: "No tienes permisos para eliminar esta incidencia." });
    }

    await incidencia.destroy();

    res.status(200).json({ message: "Incidencia eliminada correctamente." });
  } catch (error) {
    res.status(500).json({ 
      error: "Error al eliminar la incidencia.", 
      detalles: error.message 
    });
  }
};