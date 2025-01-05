// events/ready.js
const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Logged in as ${client.user.tag}!`);

        // Set the bot's status (Playing on MysticRPG)
        client.user.setActivity('on MysticRPG', { type: ActivityType.Playing });
    },
};
