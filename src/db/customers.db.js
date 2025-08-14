const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("customer_info", "postgres", "0000", {
  host: "localhost",
  dialect: "postgres",
  logging: false,
});

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
})();

module.exports = sequelize;
