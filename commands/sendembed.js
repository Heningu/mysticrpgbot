// commands/sendEmbed.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const embedMessages = require('../data/embedMessages.json');
const config = require('../data/config.json'); // Suppose you store adminRoleId in config.json

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sendembed')
        .setDescription('Sends an embedded message')
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Type of embed to send')
                .setRequired(true)
                .addChoices(
                    { name: 'Rules', value: 'rules' },
                    { name: 'Info', value: 'info' },
                    { name: 'HTC', value: 'htc' }
                )
        ),
    async execute(interaction) {
        // For example, your config file might have:
        // { "adminRoleId": "1273989601102532608", ... }
        const adminRoleId = config.adminRoleId;

        if (!interaction.member.roles.cache.has(adminRoleId)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const type = interaction.options.getString('type');
        const chosenEmbed = embedMessages[type];

        if (!chosenEmbed) {
            return interaction.reply({
                content: 'Invalid embed type specified.',
                ephemeral: true
            });
        }

        // Build the embed dynamically from JSON
        const embed = new EmbedBuilder()
            .setTitle(chosenEmbed.title)
            .setDescription(chosenEmbed.description)
            .setColor(chosenEmbed.color) // Already an integer
            .setTimestamp()
            .setFooter({ text: chosenEmbed.footer });

        try {
            // Send the embed directly to the channel
            await interaction.channel.send({ embeds: [embed] });

            // Acknowledge with ephemeral message
            await interaction.reply({
                content: 'Embed has been sent successfully!',
                ephemeral: true
            });
        } catch (error) {
            console.error(`Error sending embed: ${error}`);
            await interaction.reply({
                content: 'There was an error sending the embed.',
                ephemeral: true
            });
        }
    },
};
