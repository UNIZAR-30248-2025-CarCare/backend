import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME, // Nombre de la base de datos
  process.env.DB_USER, // Usuario de la base de datos
  process.env.DB_PASS, // Contraseña de la base de datos
  {
    host: process.env.DB_HOST, // Host de la base de datos
    dialect: "mysql", // Dialecto de la base de datos
    port: process.env.DB_PORT || 3306, // Puerto de la base de datos (por defecto 3306)
  }
);

export default sequelize;
