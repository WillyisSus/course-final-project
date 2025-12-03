import { configDotenv } from "dotenv";
import { Sequelize } from "sequelize";
import initModels from "../models/init-models.js";
configDotenv();
const sequelize = new Sequelize({
    dialect: process.env.DB_DIALECT,
    host:process.env.DB_HOST,
    port:process.env.DB_PORT,
    database:process.env.DB_NAME,
    username:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
})
const models = initModels(sequelize);
export {sequelize};

export default models;