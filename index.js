// index.js

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, Events } = require('discord.js');
const fs = require('fs');

// Initialize client with intents and partials
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // Guild-related events
        GatewayIntentBits.GuildMembers, // Guild member events
        GatewayIntentBits.GuildMessages, // Guild message events
        GatewayIntentBits.MessageContent, // To read message content (if needed)
        GatewayIntentBits.DirectMessages, // Direct message events
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel] // For handling direct messages
});

// Command collection
client.commands = new Collection();

// Read command files
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// Read event files
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Log in to Discord
client.login(process.env.DISCORD_TOKEN);

