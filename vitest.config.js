import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Solo incluir archivos .test.js dentro de src/tests/unit y src/tests/integration
    include: [
      'src/tests/unit/**/*.test.js',
      'src/tests/integration/**/*.test.js'
    ],
    // Excluir explícitamente archivos que no son tests
    exclude: [
      'node_modules/**',
      'src/config/**',
      'src/models/**',
      'src/controllers/**',
      'src/routes/**',
      'src/middlewares/**',
      'src/tests/seeders/**',
      'src/tests/reserva.test.js', // Excluir este archivo viejo
      '**/*.config.js',
      '**/database.test.js'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: [
        'node_modules/',
        'src/tests/',
        'src/config/',
        'server.js'
      ]
    },
  },
});