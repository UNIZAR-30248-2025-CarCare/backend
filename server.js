import express from "express";
import sequelize from "./src/config/database.js";
import Usuario from "./src/models/Usuario.js";
import Vehiculo from "./src/models/Vehiculo.js";

// ✅ Crear instancia de Express ANTES de usarla
const app = express();
app.use(express.json());

// Rutas de prueba (opcional)
app.get("/", (req, res) => {
  res.send("🚗 Bienvenido a la API de CarCare");
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado a la base de datos.");

    // Sincroniza modelos con la base de datos
    await sequelize.sync({ alter: true });
    console.log("📦 Modelos sincronizados con la base de datos.");

    // ✅ Aquí ya existe 'app', por lo que no fallará
    app.listen(3000, () => {
      console.log("🚀 Servidor iniciado en http://localhost:3000");
    });
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error);
  }
}

startServer();
