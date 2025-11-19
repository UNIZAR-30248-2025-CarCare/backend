import Repostaje from "../models/Repostaje.js";
import Viaje from "../models/Viaje.js";
import Vehiculo from "../models/Vehiculo.js";
import Usuario from "../models/Usuario.js";

// 1. Crear un repostaje
export const crearRepostaje = async (req, res) => {
  try {
    const { usuarioId, vehiculoId, fecha, litros, precioPorLitro, precioTotal } = req.body;

    // Comprobar que existe el usuario
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(400).json({ error: "El usuario no existe" });
    }

    // Comprobar que existe el vehículo
    const vehiculo = await Vehiculo.findByPk(vehiculoId);
    if (!vehiculo) {
      return res.status(400).json({ error: "El vehículo no existe" });
    }

    // Comprobar que la fecha es válida
    if (!fecha || isNaN(Date.parse(fecha))) {
      return res.status(400).json({ error: "La fecha no es válida" });
    }

    const inicio = new Date(fecha);
    if (isNaN(inicio.getTime()) || !fecha) {
      return res.status(400).json({ error: "Las fechas deben tener un formato válido" });
    }
    // Comprobar que los litros son float y > 0
    if (typeof litros !== "number" || litros <= 0) {
      return res.status(400).json({ error: "Los litros deben ser un número mayor que 0" });
    }

    // Comprobar que los precios son float y > 0
    if (typeof precioPorLitro !== "number" || precioPorLitro <= 0) {
      return res.status(400).json({ error: "El precio por litro debe ser un número mayor que 0" });
    }
    if (typeof precioTotal !== "number" || precioTotal <= 0) {
      return res.status(400).json({ error: "El precio total debe ser un número mayor que 0" });
    }

    const repostaje = await Repostaje.create({
      usuarioId,
      vehiculoId,
      fecha,
      litros,
      precioPorLitro,
      precioTotal
    });
    res.status(201).json(repostaje);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el repostaje", detalles: error.message });
  }
};

// 2. Obtener todos los repostajes de un vehículo (con totales)
export const obtenerRepostajesVehiculo = async (req, res) => {
  try {
    const { vehiculoId } = req.params;
    // Incluir el usuario asociado a cada repostaje
    const repostajes = await Repostaje.findAll({
      where: { vehiculoId },
      include: [{ model: Usuario, attributes: ['id', 'nombre'] }]
    });

    // Calcular totales
    const totalLitros = repostajes.reduce((sum, r) => sum + (r.litros || 0), 0);
    const totalPrecio = repostajes.reduce((sum, r) => sum + (r.precioTotal || 0), 0);

    // Mapear para devolver también el nombre del usuario
    const repostajesConUsuario = repostajes.map(r => ({
      id: r.id,
      usuarioId: r.usuarioId,
      usuarioNombre: r.Usuario ? r.Usuario.nombre : null,
      vehiculoId: r.vehiculoId,
      fecha: r.fecha,
      litros: r.litros,
      precioPorLitro: r.precioPorLitro,
      precioTotal: r.precioTotal
    }));

    res.json({
      repostajes: repostajesConUsuario,
      totalLitros,
      totalPrecio
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener repostajes", detalles: error.message });
  }
};

// 3. Calcular a quién le toca el próximo repostaje y de cuántos €
export const calcularProximoRepostaje = async (req, res) => {
  try {
    const { vehiculoId } = req.params;

    // Obtener todos los viajes de ese vehículo
    const viajes = await Viaje.findAll({ where: { vehiculoId } });

    // Sumar km realizados por usuario
    const kmPorUsuario = {};
    viajes.forEach(v => {
      if (!kmPorUsuario[v.usuarioId]) kmPorUsuario[v.usuarioId] = 0;
      kmPorUsuario[v.usuarioId] += v.kmRealizados || 0;
    });

    // Obtener todos los repostajes de ese vehículo
    const repostajes = await Repostaje.findAll({ where: { vehiculoId } });
    const totalRepostajes = repostajes.reduce((sum, r) => sum + (r.precioTotal || 0), 0);

    // Sumar km totales
    const kmTotales = Object.values(kmPorUsuario).reduce((a, b) => a + b, 0);

    // Calcular cuánto debería haber pagado cada usuario según sus km
    const deudaPorUsuario = {};
    for (const usuarioId in kmPorUsuario) {
      deudaPorUsuario[usuarioId] = kmTotales > 0
        ? (kmPorUsuario[usuarioId] / kmTotales) * totalRepostajes
        : 0;
    }

    // Calcular cuánto ha pagado cada usuario
    const pagadoPorUsuario = {};
    repostajes.forEach(r => {
      if (!pagadoPorUsuario[r.usuarioId]) pagadoPorUsuario[r.usuarioId] = 0;
      pagadoPorUsuario[r.usuarioId] += r.precioTotal || 0;
    });

    // Calcular saldo de cada usuario (positivo = ha pagado de más, negativo = debe)
    const saldoPorUsuario = {};
    for (const usuarioId in deudaPorUsuario) {
      saldoPorUsuario[usuarioId] = (pagadoPorUsuario[usuarioId] || 0) - deudaPorUsuario[usuarioId];
    }

    // El próximo repostaje le toca al que más debe (saldo más negativo)
    let proximoUsuarioId = null;
    let saldoMin = 0;
    for (const usuarioId in saldoPorUsuario) {
      if (saldoPorUsuario[usuarioId] < saldoMin) {
        saldoMin = saldoPorUsuario[usuarioId];
        proximoUsuarioId = usuarioId;
      }
    }

    // Si todos están a cero o positivos, le toca al que menos saldo tenga
    if (!proximoUsuarioId) {
      for (const usuarioId in saldoPorUsuario) {
        if (saldoPorUsuario[usuarioId] < saldoMin || proximoUsuarioId === null) {
          saldoMin = saldoPorUsuario[usuarioId];
          proximoUsuarioId = usuarioId;
        }
      }
    }

    // Obtener datos del usuario
    let usuario = null;
    if (proximoUsuarioId) {
      usuario = await Usuario.findByPk(proximoUsuarioId, { attributes: ["id", "nombre", "email"] });
    }

    // Calcular el importe estimado del próximo repostaje (media de los anteriores)
    const importeEstimado = repostajes.length > 0
      ? repostajes.reduce((sum, r) => sum + (r.precioTotal || 0), 0) / repostajes.length
      : 0;

    res.json({
      proximoUsuario: usuario,
      saldoPorUsuario,
      importeEstimado: Number(importeEstimado.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ error: "Error al calcular el próximo repostaje", detalles: error.message });
  }
};