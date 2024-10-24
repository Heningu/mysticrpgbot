// commands/setupTicket.js

const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-ticket')
        .setDescription('Sets up the ticket creation message'),
    async execute(interaction) {

        const adminRoleId = '1273989601102532608'; // Replace with your actual admin role ID

        if (!interaction.member.roles.cache.has(adminRoleId)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        
        
        
        
        // Create the embed message
        const embed = new EmbedBuilder()
            .setTitle('🎫 Support Ticket')
            .setDescription('Click the button below to create a support ticket.')
            .setColor(0x0099FF) // Hexadecimal color code
            .setTimestamp();

        // Create the "Create Ticket" button
        const createTicketButton = new ButtonBuilder()
            .setCustomId('createSupportTicket') // Unique identifier for the button
            .setLabel('Create Ticket')
            .setStyle(ButtonStyle.Primary); // Button style (Primary, Secondary, Success, Danger, Link)

        // Create the action row and add the button to it
        const row = new ActionRowBuilder().addComponents(createTicketButton);

        try {
            // Send the embed with the button to the channel where the command was used
            await interaction.channel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: 'Ticket creation message has been sent!', ephemeral: true });
        } catch (error) {
            console.error(`Error sending ticket creation message: ${error}`);
            await interaction.reply({ content: 'There was an error setting up the ticket system.', ephemeral: true });
        }
    },
};
