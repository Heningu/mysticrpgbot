const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../data/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-ticket')
        .setDescription('Sets up the ticket creation message'),
    async execute(interaction) {
        const adminRoleId = config.adminRoleId;

        if (!interaction.member.roles.cache.has(adminRoleId)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎫 Support Ticket')
            .setDescription('Click the button below to create a support ticket.')
            .setColor(0x0099FF)
            .setTimestamp();

        const createTicketButton = new ButtonBuilder()
            .setCustomId('createSupportTicket')
            .setLabel('Create Ticket')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(createTicketButton);

        try {
            await interaction.channel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: 'Ticket creation message has been sent!', ephemeral: true });
        } catch (error) {
            console.error(`Error sending ticket creation message: ${error}`);
            await interaction.reply({ content: 'There was an error setting up the ticket system.', ephemeral: true });
        }
    },
};
