-- Script de inicialización de la base de datos con datos de ejemplo
USE carcare_db;

-- Esperar a que Sequelize cree las tablas
-- Este script se ejecutará después de que la aplicación sincronice los modelos

-- Insertar usuarios de ejemplo
-- Nota: Las contraseñas están hasheadas con bcrypt (contraseña: "password123")
INSERT INTO Usuarios (nombre, email, contraseña, fecha_nacimiento, ubicaciones_preferidas, createdAt, updatedAt) VALUES
('Juan Pérez', 'juan.perez@email.com', '$2b$10$rZ5qE7xKX8yN9vJ3QzGKZuXw8Y3qF7VwN4tR6pL2mK9jH8sD5wE6a', '1990-05-15', '[]', NOW(), NOW()),
('María García', 'maria.garcia@email.com', '$2b$10$rZ5qE7xKX8yN9vJ3QzGKZuXw8Y3qF7VwN4tR6pL2mK9jH8sD5wE6a', '1985-08-22', '[{"nombre": "Taller Central", "direccion": "Calle Mayor 45", "latitud": 41.6488, "longitud": -0.8891}]', NOW(), NOW()),
('Carlos Rodríguez', 'carlos.rodriguez@email.com', '$2b$10$rZ5qE7xKX8yN9vJ3QzGKZuXw8Y3qF7VwN4tR6pL2mK9jH8sD5wE6a', '1992-03-10', '[]', NOW(), NOW()),
('Ana Martínez', 'ana.martinez@email.com', '$2b$10$rZ5qE7xKX8yN9vJ3QzGKZuXw8Y3qF7VwN4tR6pL2mK9jH8sD5wE6a', '1988-11-30', '[{"nombre": "Gasolinera Norte", "direccion": "Avda. Goya 120", "latitud": 41.6560, "longitud": -0.8773}]', NOW(), NOW()),
('Luis Fernández', 'luis.fernandez@email.com', '$2b$10$rZ5qE7xKX8yN9vJ3QzGKZuXw8Y3qF7VwN4tR6pL2mK9jH8sD5wE6a', '1995-07-18', '[]', NOW(), NOW());

-- Insertar vehículos de ejemplo
INSERT INTO Vehiculos (nombre, matricula, modelo, fabricante, antiguedad, tipo_combustible, litros_combustible, consumo_medio, ubicacion_actual, estado, createdAt, updatedAt) VALUES
('Mi Seat León', '1234ABC', 'León', 'Seat', 5, 'diesel', 45.5, 5.2, '{"latitud": 41.6488, "longitud": -0.8891}', 'activo', NOW(), NOW()),
('Toyota Familiar', '5678DEF', 'Corolla', 'Toyota', 3, 'hibrido', 38.0, 4.5, '{"latitud": 41.6520, "longitud": -0.8850}', 'activo', NOW(), NOW()),
('BMW Deportivo', '9012GHI', 'Serie 3', 'BMW', 7, 'gasolina', 52.0, 7.8, '{"latitud": 41.6560, "longitud": -0.8773}', 'activo', NOW(), NOW()),
('Renault Eléctrico', '3456JKL', 'Zoe', 'Renault', 2, 'electrico', 0.0, 15.0, '{"latitud": 41.6600, "longitud": -0.8800}', 'activo', NOW(), NOW()),
('Ford Transit', '7890MNO', 'Transit', 'Ford', 10, 'diesel', 70.0, 8.5, NULL, 'mantenimiento', NOW(), NOW());

-- Asociar usuarios con vehículos (tabla intermedia UsuarioVehiculo)
INSERT INTO UsuarioVehiculos (UsuarioId, VehiculoId, createdAt, updatedAt) VALUES
(1, 1, NOW(), NOW()),  -- Juan tiene el Seat León
(2, 2, NOW(), NOW()),  -- María tiene el Toyota
(2, 4, NOW(), NOW()),  -- María también tiene el Renault eléctrico
(3, 3, NOW(), NOW()),  -- Carlos tiene el BMW
(4, 2, NOW(), NOW()),  -- Ana comparte el Toyota con María
(5, 5, NOW(), NOW());  -- Luis tiene la Ford Transit

-- Insertar invitaciones de ejemplo
INSERT INTO Invitacions (vehiculoId, creadoPorId, usuarioInvitadoId, codigo, fechaCreacion, fechaExpiracion, usado, createdAt, updatedAt) VALUES
(1, 1, NULL, 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yzA567BCD890EFG', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), false, NOW(), NOW()),
(2, 2, 4, 'xyz789abc123def456ghi789jkl012mno345pqr678stu901vwx234yzA567BCD890', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY), true, NOW(), NOW()),
(3, 3, NULL, 'mno345pqr678stu901vwx234yzA567BCD890EFGabc123def456ghi789jkl012', NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), false, NOW(), NOW());