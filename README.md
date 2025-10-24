
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

. ├── src/ │ ├── config/ # Configuración de la aplicación (conexión a BD, etc.) │ ├── controllers/ # Lógica de negocio y manejo de peticiones (qué hacer) │ ├── middlewares/ # Funciones que se ejecutan antes de los controladores (ej. autenticación) │ ├── models/ # Definición de modelos y asociaciones (Sequelize) │ ├── routes/ # Definición de rutas y endpoints │ ├── seeders/ # Scripts para poblar la base de datos con datos iniciales │ ├── tests/ # Pruebas unitarias e integración │ └── app.js # Configuración principal de Express y middleware ├── .env # Variables de entorno (no subir a repositorio) ├── Dockerfile # Configuración para construir la imagen Docker ├── docker-compose.yml # Orquestación de contenedores Docker ├── package.json # Dependencias y scripts del proyecto └── README.md # Documentación del proyecto


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

#### Asociaciones (`src/models/index.js` y `src/models/associations.js`)

| Relación | Tipo | Descripción |
| :--- | :--- | :--- |
| `Usuario` ↔ `Reserva` | 1:N | Un usuario tiene muchas reservas. Si el usuario se elimina, las reservas se eliminan (`onDelete: "CASCADE"`). |
| `Vehiculo` ↔ `Reserva` | 1:N | Un vehículo tiene muchas reservas. Si el vehículo se elimina, las reservas se eliminan. |
| `Usuario` ↔ `Vehiculo` | N:M | Un usuario puede compartir varios vehículos, y un vehículo puede ser compartido por varios usuarios (`through: "UsuarioVehiculo"`). |
| `Usuario` ↔ `Invitacion` | 1:N | Un usuario puede ser el `creador` o el `invitado` de múltiples invitaciones. |

### 🛣️ Rutas (Endpoints)

El *router* principal (`src/routes/index.js`) consolida los *routers* de los recursos:

| Ruta Base | Fichero de Rutas | Funcionalidad Principal | Protección |
| :--- | :--- | :--- | :--- |
| `/usuario` | `usuarioRoutes.js` | Autenticación (`sign-up`, `sign-in`). | Parcialmente (solo consulta de nombre). |
| `/vehiculo` | `vehiculoRoutes.js` | CRUD parcial (registro, obtención y actualización de ubicación). | **Todas** las rutas están protegidas. |
| `/invitacion` | `invitacionRoutes.js` | Generación, aceptación, rechazo y listado de invitaciones. | **Todas** las rutas están protegidas. |
| `/reserva` | `reservaRoutes.js` | CRUD de reservas. | Ninguna (Requiere implementación). |

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

### 🧪 Pruebas Unitarias/Integración

#### `src/tests/reserva.test.js`

Este fichero utiliza **Jest** y **Sequelize** para probar el modelo de `Reserva`.

| Prueba | Validación Clave |
| :--- | :--- |
| **Setup (`beforeAll`)** | Sincroniza la BD con `force: true` y crea un usuario/vehículo de prueba. |
| **Creación Correcta** | Verifica la creación y la asignación de IDs de usuario/vehículo. |
| **Validación de Fechas** | **Falla esperado:** Comprueba que el *hook* de validación rechace la reserva si `fechaFin` no es posterior a `fechaInicio`. |
| **Actualización/Eliminación** | Pruebas CRUD básicas para asegurar la persistencia y la eliminación de datos. |