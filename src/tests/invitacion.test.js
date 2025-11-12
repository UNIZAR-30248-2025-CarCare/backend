import request from "supertest";
import app from "../app.js"; // asegúrate de que apunta bien
import sequelize from "../config/database.js";
import { Usuario, Vehiculo, Invitacion } from "../models/index.js";
import { generarToken } from "../middlewares/authMiddleware.js";

describe("🔗 Tests de Invitaciones", () => {
    let usuarioCreador;
    let usuarioInvitadoAcepta;
    let usuarioInvitadoRechaza;
    let vehiculo;
    let tokenCreador;
    let codigoInvitacion;

    // 🧱 Antes de todos los tests
    beforeAll(async () => {
        await sequelize.sync({ force: true }); // limpia la BD

        // Crear usuarios
        usuarioCreador = await Usuario.create({
        nombre: "Carlos",
        email: "carlos@example.com",
        contrasegna: "123456",
        fecha_nacimiento: "1990-05-15",
        });

        usuarioInvitadoAcepta = await Usuario.create({
        nombre: "Lucía",
        email: "lucia@example.com",
        contrasegna: "123456",
        fecha_nacimiento: "1990-05-15",
        });

        usuarioInvitadoRechaza = await Usuario.create({
        nombre: "Miguel",
        email: "miguel@example.com",
        contrasegna: "123456",
        fecha_nacimiento: "1990-05-15",
        });

        // Crear vehículo
        vehiculo = await Vehiculo.create({
            usuarioId: usuarioCreador.id,
            nombre: "Seat Ibiza",
            matricula: "1234ABC",
            modelo: "2020",
            fabricante: "Seat",
            antiguedad: 3,
            tipo_combustible: "Diésel",
            litros_combustible: 50,
            consumo_medio: 5.5,
            estado: "Activo",
        });

        // Generar token para el creador
        tokenCreador = generarToken(usuarioCreador);
    });

    // 🧹 Después de todos los tests
    afterAll(async () => {
        await sequelize.close();
    });

    // ✅ Test 1: generar invitación
    test("POST invitacion/generarInvitacion/:vehiculoId - Debe generar una invitación correctamente", async () => {
        const res1 = await request(app)
        .post(`/invitacion/generarInvitacion/${vehiculo.id}`)
        .set("Authorization", `Bearer ${tokenCreador}`)
        .send({
            usuarioId: usuarioCreador.id,
            emailInvitado: usuarioInvitadoAcepta.email
        });

        expect(res1.statusCode).toBe(200);
        expect(res1.body).toHaveProperty("codigo");
        expect(res1.body).toHaveProperty("vehiculo");
        expect(res1.body.message).toBe("Invitación generada exitosamente");

        codigoInvitacion = res1.body.codigo; // <-- guardamos el código para el siguiente test

        // Comprueba que la invitación existe en BD
        const invitacion = await Invitacion.findOne({
        where: { vehiculoId: vehiculo.id, creadoPorId: usuarioCreador.id }
        });
        expect(invitacion).not.toBeNull();
    });

    // ✅ Test 2: aceptar invitación
    test("POST /invitacion/aceptarInvitacion - Debe aceptar una invitación correctamente", async () => {
        const res = await request(app)
        .post(`/invitacion/aceptarInvitacion`)
        .set("Authorization", `Bearer ${tokenCreador}`) // en el futuro: token del invitado
        .send({ codigo: codigoInvitacion });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe(
        "Invitación aceptada correctamente. Ahora eres copropietario del vehículo."
        );

        const invitacion = await Invitacion.findOne({ where: { codigo: codigoInvitacion } });
        expect(invitacion.usado).toBe(true);
    });

    // ✅ Test 3: rechazar invitación
    test("POST /invitacion/rechazarInvitacion - Debe rechazar una invitación correctamente", async () => {
        // Primero generamos una nueva invitación para poder rechazarla
        const nuevaInvitacion = await request(app)
            .post(`/invitacion/generarInvitacion/${vehiculo.id}`)
            .set("Authorization", `Bearer ${tokenCreador}`)
            .send({
                usuarioId: usuarioCreador.id,
                emailInvitado: usuarioInvitadoRechaza.email
            });

        expect(nuevaInvitacion.statusCode).toBe(200);

        // Obtenemos la invitación recién creada desde la BD
        const invitacion = await Invitacion.findOne({
            where: { 
                vehiculoId: vehiculo.id,
                creadoPorId: usuarioCreador.id,
                usuarioInvitadoId: usuarioInvitadoRechaza.id,
                usado: false
            }
        });
        expect(invitacion).not.toBeNull();

        // Ahora el usuario invitado la rechaza
        const res = await request(app)
            .post("/invitacion/rechazarInvitacion")
            .set("Authorization", `Bearer ${generarToken(usuarioInvitadoRechaza)}`)
            .send({
                invitacionId: invitacion.id,
                usuarioId: usuarioInvitadoRechaza.id
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Invitación rechazada y eliminada correctamente.");

        // Verificamos que en BD la invitación ahora esté marcada como usada
        const invitacionRechazada = await Invitacion.findByPk(invitacion.id);
        expect(invitacionRechazada.usado).toBe(true);
    });

});
