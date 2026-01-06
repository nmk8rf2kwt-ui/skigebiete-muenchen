export default {
    testEnvironment: 'node',
    transform: {},
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'services/**/*.js',
        'routes/**/*.js',
        '!**/node_modules/**',
    ],
    coverageThreshold: {
        global: {
            statements: 50,
            branches: 40,
            functions: 50,
            lines: 50
        }
    }
};
