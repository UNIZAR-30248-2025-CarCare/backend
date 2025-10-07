import { sequelize } from "./src/config/database.js";
import "./src/models/usuario_vehiculos.js"; 

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos exitosa.");

    await sequelize.sync({ alter: true });
    console.log("📦 Modelos sincronizados con la base de datos.");

    app.listen(PORT, () => {
      console.log(`🚀 Servidor CarCare en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error);
  }
}

// Asignar vehículo a usuario
router.post("/:usuarioId/vehiculos/:vehiculoId", async (req, res) => {
  try {
    const { usuarioId, vehiculoId } = req.params;
    const usuario = await Usuario.findByPk(usuarioId);
    const vehiculo = await Vehiculo.findByPk(vehiculoId);

    if (!usuario || !vehiculo) {
      return res.status(404).json({ error: "Usuario o Vehículo no encontrado" });
    }

    await usuario.addVehiculo(vehiculo);
    res.json({ message: "🚗 Vehículo asignado al usuario correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


startServer();
