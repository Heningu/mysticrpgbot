// events/messageCreate.js
const config = require('../config.json');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        // Check if the message is in a filtered channel
        if (!config.filteredChannels.includes(message.channel.name)) return;

        // Check for bad words
        const messageContent = message.content.toLowerCase();
        const foundBadWord = config.badWords.find(word => messageContent.includes(word.toLowerCase()));

        if (foundBadWord) {
            try {
                await message.delete();
                await message.channel.send(`${message.author}, please avoid using inappropriate language.`);
                // Optionally, log the incident or take further action
            } catch (error) {
                console.error(`Failed to delete message or send warning: ${error}`);
            }
        }
    },
};
