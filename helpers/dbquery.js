const { Client: DBClient } = require('pg');
const dotenv = require('dotenv');

// Initialize dotenv
dotenv.config();

// Initialize Database
const dbClient = new DBClient({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	port: process.env.DB_PORT,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
});

dbClient.connect();

dbClient.query("SELECT * FROM rolemenus WHERE guild_id = 22324").then(res => console.log(res))