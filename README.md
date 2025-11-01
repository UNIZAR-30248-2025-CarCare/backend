
# 🚗 Aplicación de Gestión de Vehículos Compartidos (Backend API)

# backend
Esta es la API *backend* para una aplicación de gestión de vehículos compartidos y reservas. Está construida usando **Node.js, Express, Sequelize y PostgreSQL** (o SQLite para desarrollo/testing).

# Pasos realizados para inciar el proyecto
## 1.Inicializa el proyecto 
```
npm init -y
```
## 2.Instalar dependencias necesarias
```
npm install express cors dotenv morgan
```
## 3. Instalar nodemon (para desarrollo)
```
npm install --save-dev nodemon
```
## 4. Ejecutar
```
npm run dev
```

# Pasos para crear la BD en una terminal de linux
## 1. Instalar mysql
``` 
sudo apt update
sudo apt install mysql-server -y
```
## 2. Iniciar el servicio
```
sudo service mysql start
```
## 3. Comprobar el estado del servicio
```
sudo service mysql status
```
## 4. Entrar al cliente mysql
```
sudo mysql
```
## 5. Ejecutar lo siguiente
```
CREATE DATABASE carcare_db;
CREATE USER 'carcare'@'localhost' IDENTIFIED BY '1234';
GRANT ALL PRIVILEGES ON carcare_db.* TO 'carcare'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 🚀 Puesta en Marcha

### 🛠️ Prerrequisitos

Necesitas tener instalados en tu sistema:
* **Docker** y **Docker Compose**
* **Node.js** (versión 18 o superior)
* **npm** o **yarn**

### 🐳 Uso con Docker Compose (Recomendado)

La forma más sencilla de levantar la API y la base de datos (PostgreSQL) es mediante Docker Compose.

1.  **Construir y lanzar los contenedores:**
    ```bash
    docker-compose up --build -d
    ```
    * `docker-compose up`: Inicia los servicios definidos en `docker-compose.yml`.
    * `--build`: **Fuerza la reconstrucción** de la imagen de Node.js (necesario la primera vez o tras cambios en el `Dockerfile`).
    * `-d`: Lanza los contenedores en modo *detached* (**segundo plano**).

2.  **Verificar el estado:**
    ```bash
    docker-compose ps
    # Deberías ver el contenedor 'app' y el contenedor 'db' en estado 'Up'
    ```

3.  **Crear Tablas y Sembrar la Base de Datos:**
    Una vez que la BD (`db`) y la API (`app`) estén activas, el primer inicio de la API crea las tablas, pero se recomienda ejecutar el *seed* (sembrado de datos) manualmente para datos de prueba:
    ```bash
    docker-compose exec app npm run seed
    ```
    * **Credenciales de prueba:** Todos los usuarios creados tendrán la contraseña: `password123`.

4.  **Acceder a la Shell del contenedor (Opcional):**
    Si necesitas ejecutar comandos dentro del entorno de la API (por ejemplo, para depurar o ejecutar *tests*):
    ```bash
    docker-compose exec app sh
    ```

5.  **Detener los contenedores:**
    ```bash
    docker-compose down
    ```
    * **Nota:** Esto detiene y elimina los contenedores y redes, pero **mantiene el volumen de datos** de PostgreSQL. Para eliminar también los datos: `docker-compose down -v`.

## 📂 Estructura de Directorios

La aplicación sigue una estructura modular para separar responsabilidades (MVC - Modelo, Vista, Controlador, adaptado a API):

````
.
├── src/
│   ├── config/          # Configuración de la aplicación (conexión a BD, etc.)
│   ├── controllers/     # Lógica de negocio y manejo de peticiones (qué hacer)
│   ├── middlewares/     # Funciones que se ejecutan antes de los controladores (ej. autenticación)
│   ├── models/          # Definición de modelos y asociaciones (Sequelize)
│   ├── routes/          # Definición de rutas y endpoints
│   ├── seeders/         # Scripts para poblar la base de datos con datos iniciales
│   ├── tests/           # Pruebas unitarias e integración
│   └── app.js           # Configuración principal de Express y middleware
├── .env                 # Variables de entorno (no subir al repositorio)
├── Dockerfile           # Configuración para construir la imagen Docker
├── docker-compose.yml   # Orquestación de contenedores Docker
├── package.json         # Dependencias y scripts del proyecto
└── README.md            # Documentación del proyecto

````

## 🧩 Detalle de Componentes Clave

### 🛡️ Middlewares

El *middleware* principal es el de autenticación, que asegura que las rutas protegidas solo puedan ser accedidas con un token JWT válido.

#### `src/middlewares/authMiddleware.js`

| Función | Descripción | Protección |
| :--- | :--- | :--- |
| `verificarToken` | Extrae el token del encabezado `Authorization` (`Bearer`). **Verifica su validez** y decodifica el *payload* (información del usuario), adjuntándolo a `req.usuario` para uso posterior en los controladores. | **JWT** |

### 📦 Modelos de Sequelize y Asociaciones

Los modelos definen las tablas de la base de datos y sus relaciones.

#### Modelos

| Modelo | Descripción | Campos Clave | Validación/Hooks |
| :--- | :--- | :--- | :--- |
| **Usuario** | Gestión de usuarios. | `id`, `nombre`, `email` (único), `contrasegna` (hashed). | Almacena `ubicaciones_preferidas` como JSON. |
| **Vehiculo** | Gestión de vehículos. | `id`, `matricula` (única), `tipo_combustible` (ENUM), `estado` (ENUM). | Almacena `ubicacion_actual` como JSON. |
| **Reserva** | Períodos de tiempo en que un usuario reserva un vehículo. | `id`, `fechaInicio`, `fechaFin`, `horaInicio`, `horaFin`. | Hook `beforeValidate`: **`fechaFin` debe ser posterior a `fechaInicio`**. |
| **Invitacion** | Permite a un usuario invitar a otro a un vehículo. | `id`, `codigo` (único), `vehiculoId`, `creadoPorId`. | Controla la fecha de expiración y el estado `usado`. |
| **Viaje** | Registra viajes realizados con un vehículo por un usuario. | `id`, `usuarioId`, `vehiculoId`, `nombre`, `fechaHoraInicio`, `fechaHoraFin`, `kmRealizados`, `consumoCombustible`, `ubicacionFinal`. | Validar formato fechas; `fechaHoraInicio` ≤ `fechaHoraFin`; `kmRealizados` y `consumoCombustible` > 0. |
| **Repostaje** | Registra repostajes realizados. | `id`, `usuarioId`, `vehiculoId`, `fecha`, `litros` (FLOAT), `precioPorLitro` (FLOAT), `precioTotal` (FLOAT). | `fecha` válida; `litros`, `precioPorLitro`, `precioTotal` > 0. |

#### Asociaciones (`src/models/index.js` y `src/models/associations.js`)

| Relación | Tipo | Descripción |
| :--- | :--- | :--- |
| `Usuario` ↔ `Reserva` | 1:N | Un usuario tiene muchas reservas. Si el usuario se elimina, las reservas se eliminan (`onDelete: "CASCADE"`). |
| `Vehiculo` ↔ `Reserva` | 1:N | Un vehículo tiene muchas reservas. Si el vehículo se elimina, las reservas se eliminan. |
| `Usuario` ↔ `Vehiculo` | N:M | Un usuario puede compartir varios vehículos, y un vehículo puede ser compartido por varios usuarios (`through: "UsuarioVehiculo"`). |
| `Usuario` ↔ `Invitacion` | 1:N | Un usuario puede ser el `creador` o el `invitado` de múltiples invitaciones. Relaciones explícitas: `Invitacion.belongsTo(Usuario, { as: 'creador', foreignKey: 'creadoPorId' })` y `Invitacion.belongsTo(Usuario, { as: 'invitado', foreignKey: 'usuarioInvitadoId' })`. |
| `Vehiculo` ↔ `Invitacion` | 1:N | Un vehículo puede tener muchas invitaciones (`vehiculoId` en `Invitacion`). |
| `Usuario` ↔ `Viaje` | 1:N | Un usuario realiza muchos viajes. `Viaje.belongsTo(Usuario)` y `Usuario.hasMany(Viaje)`. |
| `Vehiculo` ↔ `Viaje` | 1:N | Un vehículo tiene muchos viajes. Si se elimina el vehículo, considerar `onDelete` según política de negocio. |
| `Usuario` ↔ `Repostaje` | 1:N | Un usuario puede registrar muchos repostajes. `Repostaje.belongsTo(Usuario)` y `Usuario.hasMany(Repostaje)`. |
| `Vehiculo` ↔ `Repostaje` | 1:N | Un vehículo puede tener muchos repostajes. `Repostaje.belongsTo(Vehiculo)` y `Vehiculo.hasMany(Repostaje)`. |
| `Viaje` ↔ `Repostaje` | 0:N (opcional) | Repostajes no dependen necesariamente de viajes, pero se pueden relacionar si se desea trazabilidad (campo opcional `viajeId`). |
| Índices / Integridad | - | Añadir índices en FK (`usuarioId`, `vehiculoId`) y unicidad en `Usuario.email`, `Vehiculo.matricula`, `Invitacion.codigo`. Usar `onDelete`/`onUpdate` coherentes (CASCADE/RESTRICT) según la regla de negocio. |

### 🛣️ Rutas (Endpoints)

El *router* principal (`src/routes/index.js`) consolida los *routers* de los recursos:

| Ruta Base | Fichero de Rutas | Funcionalidad Principal | Protección |
| :--- | :--- | :--- | :--- |
| `/usuario` | `usuarioRoutes.js` | Autenticación (`sign-up`, `sign-in`). | Parcialmente (solo consulta de nombre). |
| `/vehiculo` | `vehiculoRoutes.js` | CRUD parcial (registro, obtención y actualización de ubicación). | **Todas** las rutas están protegidas. |
| `/invitacion` | `invitacionRoutes.js` | Generación, aceptación, rechazo y listado de invitaciones. | **Todas** las rutas están protegidas. |
| `/reserva` | `reservaRoutes.js` | CRUD de reservas. | Ninguna (Requiere implementación). |
| `/viaje` | `viajeRoutes.js` | Gestión de viajes. | **Todas** las rutas están protegidas. |
| `/repostaje` | `repostajeRoutes.js` | Gestión de repostajes. | **Todas** las rutas están protegidas. |

**Ejemplos de Endpoints Protegidos:**

| Método | Ruta | Controller |
| :--- | :--- | :--- |
| `POST` | `/vehiculo/registrar` | `registrarVehiculo` |
| `GET` | `/invitacion/invitacionesRecibidas/:usuarioId` | `obtenerInvitacionesRecibidas` |
| `POST` | `/invitacion/aceptarInvitacion` | `aceptarInvitacion` |

### 🌱 Seeding (Población de Datos)

#### `src/seeders/seedDatabase.js`

Este script poblacional crea datos de prueba para la base de datos (usuarios, vehículos, asociaciones e invitaciones).

| Elemento | Cantidad | Detalles |
| :--- | :--- | :--- |
| **Usuarios** | 5 | Todos con contraseña: `password123`. |
| **Vehículos** | 5 | Diferentes tipos (coche, furgoneta) y estados (activo, mantenimiento). |
| **Asociaciones** | 5 | Se establecen relaciones N:M, incluyendo un vehículo compartido (Toyota). |
| **Invitaciones**| 3 | 1 pendiente (código genérico), 1 aceptada, y 1 pendiente (dirigida a un usuario). |

### 🧪 Pruebas Unitarias / Integración (Vitest)

Ahora las pruebas usan Vitest (sustituye a Jest). Las pruebas están divididas en unitarias (mocks) y de integración (arrancan la app contra la BD de test).

Comandos útiles
- Ejecutar todas las pruebas:
  ```bash
  npm test
  # o (directo Vitest)
  npx vitest
  ```
- Ejecutar solo unitarios:
  ```bash
  npx vitest run src/tests/unit
  ```
- Ejecutar solo integraciones:
  ```bash
  npx vitest run src/tests/integration
  ```
- Ejecutar en modo watch (desarrollo):
  ```bash
  npx vitest --watch
  ```

Requisitos para las pruebas
- Usar la base de datos de test: exportar NODE_ENV=test antes de lanzar las pruebas.
  - En Windows PowerShell:
    ```powershell
    $env:NODE_ENV = "test"
    npm test
    ```
- Los helpers de test están en `src/tests/seeders` y exponen: `setupDatabase()`, `cleanDatabase()` y `closeDatabase()` para inicializar/limpiar/cerrar la BD (SQLite en test).

Estructura de tests (resumen)
- Unitarios (mockean modelos)
  - `src/tests/unit/usuarioController.test.js` — controlador Usuario (registro, login, validaciones).
  - `src/tests/unit/vehiculoController.test.js` — controlador Vehículo (registro, actualización, eliminación).
  - `src/tests/unit/repostajeController.test.js` — controlador Repostaje (validaciones, lógica de totales y reparto).
  - `src/tests/unit/viajeController.test.js` — controlador Viaje (validaciones de fechas, kms, consumo, ubicación).
  - `src/tests/unit/invitacionController.test.js` — controlador Invitación (generar/aceptar/rechazar/listar).
  - Otros controllers tienen tests unitarios en la misma carpeta.

- Integración (ejecutan endpoints contra app + BD de test)
  - `src/tests/integration/usuario.integration.test.js` — flujo completo usuario (registro, login, obtener nombre).
    - `src/tests/integration/vehiculo.integration.test.js` — flujo completo vehículo (registrar, obtener, actualizar ubicación).
  - `src/tests/integration/repostaje.integration.test.js` — flujo completo repostajes (crear, listar, calcular próximo).
  - `src/tests/integration/viaje.integration.test.js` — flujo viajes (crear, listar).
  - `src/tests/integration/invitacion.integration.test.js` — flujo invitaciones (crear, aceptar, rechazar).
  - Los tests de integración usan `request(app)` (supertest) y requieren que los endpoints y middlewares estén montados en `app` dentro de cada fichero de test.

Buenas prácticas y notas
- Asegurar unicidad en datos de seed (emails, matrículas) para evitar fallos por constraints al crear recursos en beforeEach.
- Para ver logs de `console.log` generados por los tests, mirar la terminal donde se ejecutan los tests (integración) o usar `--reporter verbose` si necesitas más detalle.
- Los tests de integración usan tokens JWT; los helpers de seed crean usuarios y devuelven credenciales de test (password: `password123`).
- Mantener los mocks coherentes con la estructura real de los modelos cuando se añade `include` en los controladores (ej. devolver `Usuario` dentro de cada repostaje cuando el controlador lo espera).

Ejemplo de flujo integrado (resumen)
1. `setupDatabase()` — crea tablas y datos base.
2. `beforeEach()` en cada test suite llama a `cleanDatabase()` para aislar pruebas.
3. Crear usuarios/vehículos vía endpoints (`/api/usuarios/sign-up`, `/api/vehiculos/registrar`).
4. Llamadas protegidas usan `Authorization: Bearer <token>` obtenido en `/api/usuarios/sign-in`.
5. `closeDatabase()` en `afterAll()` para liberar conexión.
