const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../data/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warns a member')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The member to warn')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true)
        ),
    async execute(interaction) {
        const adminRoleId = config.adminRoleId;
        const warnedRoleName = config.warnRoleName || 'Warned';

        // Double-check role
        if (!interaction.member.roles.cache.has(adminRoleId)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        // Also check if the user has MANAGE_ROLES
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ content: 'You need MANAGE_ROLES permission to use this command.', ephemeral: true });
        }

        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');
        const member = interaction.guild.members.cache.get(target.id);

        if (!member) {
            return interaction.reply({ content: 'Member not found.', ephemeral: true });
        }

        // Assign or create the "Warned" role
        let warnedRole = interaction.guild.roles.cache.find(r => r.name === warnedRoleName);
        if (!warnedRole) {
            // Create the role if it doesn't exist
            try {
                warnedRole = await interaction.guild.roles.create({
                    name: warnedRoleName,
                    color: '#FFA500',
                    reason: 'Role for warned members',
                });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: 'Failed to create Warned role.', ephemeral: true });
            }
        }

        try {
            await member.roles.add(warnedRole);
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'Failed to assign Warned role.', ephemeral: true });
        }

        // Send embedded warning message in DM
        const embed = new EmbedBuilder()
            .setTitle('You have been warned')
            .setDescription(`**Reason:** ${reason}`)
            .setColor('#FFA500')
            .setTimestamp();

        try {
            await member.send({ embeds: [embed] });
        } catch (error) {
            console.error(`Could not send DM to ${member.user.tag}.`);
        }

        await interaction.reply({ content: `${member.user.tag} has been warned.`, ephemeral: false });
    },
};
