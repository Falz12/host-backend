module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "completedLessons", {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("users", "completedLessons");
  },
};
