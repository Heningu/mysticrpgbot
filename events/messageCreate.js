const config = require('../data/config.json');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // Ignore bots
        if (message.author.bot) return;

        // Only filter if channel name is in filteredChannels
        if (!config.filteredChannels.includes(message.channel.name)) return;

        // Check for bad words
        const messageContent = message.content.toLowerCase();
        const foundBadWord = config.badWords.find(word => messageContent.includes(word.toLowerCase()));

        if (foundBadWord) {
            try {
                await message.delete();
                await message.channel.send(`${message.author}, please avoid using inappropriate language.`);
            } catch (error) {
                console.error(`Failed to delete message or send warning: ${error}`);
            }
        }
    },
};
