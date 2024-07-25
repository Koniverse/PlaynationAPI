'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('game_play', 'state', {
      type: Sequelize.JSONB
    });
    await queryInterface.addColumn('game_play', 'stateCount', {
      type: Sequelize.INTEGER
    });
    await queryInterface.addColumn('game_play', 'stateSignature', {
      type: Sequelize.STRING
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('game_play', 'state');
    await queryInterface.removeColumn('game_play', 'stateCount');
    await queryInterface.removeColumn('game_play', 'stateSignature');
  }
};
