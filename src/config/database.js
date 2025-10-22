import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

let sequelize;

if (process.env.NODE_ENV === "test") {
  // Usa SQLite en memoria para tests
  sequelize = new Sequelize("sqlite::memory:", {
    logging: false,
  });
} else {
  // Usa MySQL para desarrollo/producción
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      dialect: "mysql",
      port: process.env.DB_PORT || 3306, // Puerto de la base de datos (por defecto 3306)
    }
  );
}

export default sequelize;