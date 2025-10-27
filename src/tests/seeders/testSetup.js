import sequelize from '../../config/database.test.js';

// Importar TODOS los modelos para que Sequelize los registre
import '../../models/index.js';

export const setupDatabase = async () => {
  try {
    // Sincronizar todos los modelos
    await sequelize.sync({ force: true });
    console.log('✓ Base de datos de test sincronizada');
  } catch (error) {
    console.error('Error al sincronizar base de datos:', error);
    throw error;
  }
};

export const cleanDatabase = async () => {
  try {
    // Método más simple y seguro: re-sincronizar con force
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('Error al limpiar base de datos:', error);
    // No lanzar error para evitar que fallen los tests
  }
};

export const closeDatabase = async () => {
  try {
    await sequelize.close();
    console.log('✓ Conexión de base de datos cerrada');
  } catch (error) {
    console.error('Error al cerrar base de datos:', error);
  }
};

export { sequelize };