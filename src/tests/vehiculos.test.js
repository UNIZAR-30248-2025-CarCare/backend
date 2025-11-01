import request from 'supertest';
import app from '../app';
import sequelize from "../config/database.js";
import Vehiculo from '../models/Vehiculo.js';
import Usuario from '../models/Usuario.js';
import { generarToken } from '../middlewares/authMiddleware.js';

beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Crear usuario de prueba
    await Usuario.create({
        nombre: "Juan Tester",
        email: "juan@test.com",
        contrasegna: "123456",
        fecha_nacimiento: "1990-05-15",
    });
});

afterAll(async () => {
    await sequelize.close();
});

describe("Test de vehículos", () => {
    test("POST /vehiculo/registrar — debería registrar vehículo.", async () => {
        const usuario = await Usuario.findOne({ where: { email: "juan@test.com" } });
        const token = generarToken(usuario); 

        const res = await request(app)
        .post("/vehiculo/registrar")
        .set("Authorization", `Bearer ${token}`)
        .send({
            usuarioId: usuario.id,
            nombre: "Honda Civic",
            matricula: "XYZ987",
            modelo: "2021",
            fabricante: "Honda",
            antiguedad: 2,
            tipo_combustible: "Gasolina",
            litros_combustible: 15,
            consumo_medio: 6,
            estado: "Activo",
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.vehiculo).toBeDefined();

        const vehiculo = await Vehiculo.findByPk(res.body.vehiculo.id);
        const propietarios = await vehiculo.getUsuarios();
        expect(propietarios.length).toBe(1);
        expect(propietarios[0].id).toBe(usuario.id);
    });
});
