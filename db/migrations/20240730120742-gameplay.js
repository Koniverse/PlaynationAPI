'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('game_play', 'stateData', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('game_play', 'stateTimestamp', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('game_play', 'stateData');
    await queryInterface.removeColumn('game_play', 'stateTimestamp');
  }
};
