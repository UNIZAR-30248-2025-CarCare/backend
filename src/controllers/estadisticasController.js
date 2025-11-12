import EstadisticasService from "../models/Estadisticas.js";

export const getEstadisticas = async (req, res) => {
  try {
    const { vehiculoId } = req.params;
    const { mes, ano } = req.query;

    // Validar parámetros
    if (!mes || !ano) {
      return res.status(400).json({ 
        error: "Los parámetros 'mes' y 'ano' son obligatorios" 
      });
    }

    const mesNum = parseInt(mes);
    const anoNum = parseInt(ano);

    if (mesNum < 1 || mesNum > 12) {
      return res.status(400).json({ 
        error: "El mes debe estar entre 1 y 12" 
      });
    }

    if (anoNum < 2000 || anoNum > 2100) {
      return res.status(400).json({ 
        error: "Año inválido" 
      });
    }

    // Verificar que el vehículo pertenece al usuario autenticado
    const vehiculoIdNum = parseInt(vehiculoId);
    
    const estadisticas = await EstadisticasService.calcularEstadisticas(
      vehiculoIdNum, 
      mesNum, 
      anoNum
    );

    res.json(estadisticas);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
};
