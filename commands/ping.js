const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../data/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        const adminRoleId = config.adminRoleId;

        if (!interaction.member.roles.cache.has(adminRoleId)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        await interaction.reply('Pong!');
    },
};
