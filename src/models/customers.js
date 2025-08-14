const { DataTypes } = require("sequelize");
const sequelize = require("../db/customers.db"); // your Sequelize instance

const Customer = sequelize.define(
  "Customer",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    date: {
      type: DataTypes.STRING, // If you want actual date use DataTypes.DATEONLY
      allowNull: false,
    },
    purchased_item: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "customers",
    timestamps: false, // because we already have created_at
  }
);

module.exports = Customer;
