import BusquedaService from "../services/BusquedaService.js";

const busquedaGlobal = async (req, res) => {
  try {
    const { vehiculoId } = req.params;
    const { query } = req.query;
    const userId = req.usuario.id;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "El parámetro 'query' es requerido" });
    }

    const resultados = await BusquedaService.busquedaGlobal(vehiculoId, query, userId);
    res.status(200).json(resultados);
  } catch (error) {
    //console.error("Error en búsqueda global:", error);
    res.status(500).json({ message: error.message });
  }
};

export default {
  busquedaGlobal,
};
