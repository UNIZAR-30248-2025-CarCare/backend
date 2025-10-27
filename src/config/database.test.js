import { Sequelize } from 'sequelize';

// Base de datos SQLite en memoria para tests
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false, // Desactiva los logs SQL en los tests
});

export default sequelize;