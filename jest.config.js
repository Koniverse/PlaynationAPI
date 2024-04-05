const { defaults: tsjPreset } = require('ts-jest/presets');
const { pathsToModuleNameMapper } = require('ts-jest/dist');
const { compilerOptions } = require('./tsconfig.spec.json');

/** @returns {Promise<import('jest').Config>} */
module.exports = async () => {
  return {
    roots: [
      "<rootDir>/src"
    ],
    testMatch: [
      "**/__tests__/**/*.+(ts|tsx|js)",
      "**/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
    transform: {
      ...tsjPreset.transform
    },
    moduleNameMapper: {
      ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' })
    },
    setupFilesAfterEnv: [
      "<rootDir>/src/setup/setupTest.ts" // Path to your setup file
    ],
    testTimeout: 60000,
    verbose: false,
  };
};