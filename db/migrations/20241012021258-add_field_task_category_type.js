'use strict';

const {DataTypes} = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
        const newCols = {
            type: {
                type: DataTypes.ENUM('daily', 'weekly', 'featured'),
            },
        };
        await queryInterface.addColumn('task_category', 'type', newCols.type);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('task_category', 'type');
  }
};
