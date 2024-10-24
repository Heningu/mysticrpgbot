// deploy-commands.js
require('dotenv').config(); // Load environment variables from .env

const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const { CLIENT_ID, GUILD_ID, DISCORD_TOKEN } = process.env;

// Validate that all required environment variables are set
if (!CLIENT_ID || !GUILD_ID || !DISCORD_TOKEN) {
    console.error('Missing one or more required environment variables: CLIENT_ID, GUILD_ID, DISCORD_TOKEN');
    process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands'); // Adjust if your commands folder is elsewhere
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Read each command file and add its data to the commands array
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Initialize the REST API client
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

// Deploy the commands
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // For guild-based commands (faster deployment during development)
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        /* 
        // Uncomment the following lines to deploy global commands instead
        console.log(`Started refreshing ${commands.length} global application (/) commands.`);

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${commands.length} global application (/) commands.`);
        */

        console.log(`Successfully reloaded ${commands.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
