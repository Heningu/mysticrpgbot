const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../data/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-staff-application')
        .setDescription('Sets up the staff application system.'),
    async execute(interaction) {
        const adminRoleId = config.adminRoleId;

        if (!interaction.member.roles.cache.has(adminRoleId)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('📋 Staff Application')
            .setDescription('Click the button below to apply for a staff position. Please ensure you have read the requirements before applying.')
            .setColor(0x00AE86)
            .setTimestamp();

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('createStaffApplication')
                .setLabel('Apply for Staff')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.channel.send({ embeds: [embed], components: [button] });
        await interaction.reply({ content: 'Staff application system has been set up.', ephemeral: true });
    },
};
