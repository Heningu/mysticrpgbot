// commands/setupStaffApplication.js

const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-staff-application')
        .setDescription('Sets up the staff application system.'),

    async execute(interaction) {
        const adminRoleId = '1273989601102532608'; // Replace with your actual admin role ID

        if (!interaction.member.roles.cache.has(adminRoleId)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        
        // Create an embed for the staff application
        const embed = new EmbedBuilder()
            .setTitle('📋 Staff Application')
            .setDescription('Click the button below to apply for a staff position. Please ensure you have read the requirements in the appropriate channels before applying.')
            .setColor(0x00AE86)
            .setTimestamp();

        // Create a button to open the staff application
        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('createStaffApplication')
                .setLabel('Apply for Staff')
                .setStyle(ButtonStyle.Primary)
        );

        // Send the embed and button in the channel
        await interaction.channel.send({ embeds: [embed], components: [button] });

        // Acknowledge the command
        await interaction.reply({ content: 'Staff application system has been set up.', ephemeral: true });
    },
};
