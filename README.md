# backend
Repositorio para almacenar el código del backend en Node.js

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