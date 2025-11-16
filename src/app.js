import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import "./models/Associations.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).json({ message: "API CarCare backend funcionando" });
});

// Rutas de usuarios
import usuarioRoutes from "./routes/usuarioRoutes.js";
app.use("/usuario", usuarioRoutes);

// Rutas de vehículos
import vehiculoRoutes from "./routes/vehiculoRoutes.js";
app.use("/vehiculo", vehiculoRoutes);

// Rutas de reservas
import reservaRoutes from "./routes/reservaRoutes.js";
app.use("/reserva", reservaRoutes);

// Rutas de invitaciones
import invitacionRoutes from "./routes/invitacionRoutes.js";
app.use("/invitacion", invitacionRoutes);

// Rutas de viajes
import viajeRoutes from "./routes/viajeRoutes.js";
app.use("/viaje", viajeRoutes);

// Rutas de repostajes
import repostajeRoutes from "./routes/repostajeRoutes.js";
app.use("/repostaje", repostajeRoutes);

// Rutas de logros
import logroRoutes from "./routes/logroRoutes.js";
app.use("/logro", logroRoutes);

export default app;
