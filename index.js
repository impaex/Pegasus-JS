const fs = require('node:fs');
const path = require('node:path');
const { Client: DBClient } = require('pg');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
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


// Create a new client instance
const client = new Client({ intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
	GatewayIntentBits.MessageContent, 
    GatewayIntentBits.GuildMembers, 
	GatewayIntentBits.GuildPresences, 
    GatewayIntentBits.GuildVoiceStates
] });

// Load all commands.
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// load all events.
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args, dbClient));
	}
}

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);