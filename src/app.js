import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Rutas de usuarios
import usuarioRoutes from "./routes/usuarioRoutes.js";
app.use("/usuario", usuarioRoutes);

// Rutas de vehículos
import vehiculoRoutes from "./routes/vehiculoRoutes.js";
app.use("/vehiculo", vehiculoRoutes);

export default app;
