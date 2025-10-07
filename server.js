import app from "./src/app.js";
import sequelize from "./src/config/database.js";

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
