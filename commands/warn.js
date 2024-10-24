// commands/warn.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warns a member')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true)),
    async execute(interaction) {

        const adminRoleId = '1273989601102532608'; // Replace with your actual admin role ID

        if (!interaction.member.roles.cache.has(adminRoleId)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        
        
        // Permission check
        if (!interaction.member.permissions.has('MANAGE_ROLES')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');
        const member = interaction.guild.members.cache.get(target.id);

        if (!member) {
            return interaction.reply({ content: 'Member not found.', ephemeral: true });
        }

        // Assign 'Warned' role
        let warnedRole = interaction.guild.roles.cache.find(r => r.name === 'Warned');
        if (!warnedRole) {
            // Create the role if it doesn't exist
            try {
                warnedRole = await interaction.guild.roles.create({
                    name: 'Warned',
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

        // Send embedded warning message
        const embed = new MessageEmbed()
            .setTitle('You have been warned')
            .setDescription(`**Reason:** ${reason}`)
            .setColor('#FFA500')
            .setTimestamp();

        try {
            await member.send({ embeds: [embed] });
        } catch (error) {
            console.error(`Could not send DM to ${member.user.tag}.`);
        }

        // Inform in the channel
        await interaction.reply({ content: `${member.user.tag} has been warned.`, ephemeral: false });
    },
};
