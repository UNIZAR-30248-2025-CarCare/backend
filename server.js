import app from "./src/app.js";
import sequelize from "./src/config/database.js";
import seedDatabase from "./src/seeders/seedDatabase.js";

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado a la base de datos.");

    // Sincroniza modelos con la base de datos
    await sequelize.sync({ alter: true });
    console.log("📦 Modelos sincronizados con la base de datos.");

    // Ejecutar el seeder (solo si la BD está vacía)
    await seedDatabase();

    // Iniciar el servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error);
    process.exit(1);
  }
}

startServer();