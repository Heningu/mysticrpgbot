/*******************/
/* staffHelpers.js */
/*******************/
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const config = require('../data/config.json');

/**
 * Initiates closure confirmation for staff applications.
 */
async function initiateClosureConfirmation(interaction) {
    const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Confirm Application Closure')
        .setDescription('Are you sure you want to close this staff application?')
        .setColor(0xffa500)
        .setTimestamp();

    const confirmButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('confirmCloseStaffApp')
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cancelCloseStaffApp')
            .setLabel('No')
            .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
        embeds: [confirmEmbed],
        components: [confirmButtons],
        ephemeral: true
    });
}

/**
 * Closes a staff application by logging its messages and deleting the channel.
 */
async function closeStaffApplication(interaction, client) {
    const channel = interaction.channel;
    const guild = interaction.guild;
    const logChannelId = config.logChannelId;

    // Fetch messages
    let messages;
    try {
        messages = await fetchAllMessages(channel);
    } catch (error) {
        console.error(`Error fetching messages: ${error}`);
        return interaction.reply({
            content: 'There was an error fetching the application logs.',
            ephemeral: true
        });
    }

    const logContent = messages
        .reverse()
        .map((msg) => `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content}`)
        .join('\n');

    const logEmbed = new EmbedBuilder()
        .setTitle(`📝 Staff Application Closed: ${channel.name}`)
        .addFields(
            { name: 'Closed By', value: interaction.user.tag, inline: true },
            { name: 'Applicant', value: `<@${channel.topic}>`, inline: true },
            {
                name: 'Log',
                value: logContent.length > 4096 ? logContent.substring(0, 4093) + '...' : logContent
            }
        )
        .setColor(0xff0000)
        .setTimestamp();

    const logChannel = guild.channels.cache.get(logChannelId);

    if (!logChannel || logChannel.type !== ChannelType.GuildText) {
        console.error(`Log channel not found or not a text channel.`);
        return interaction.reply({
            content: 'Log channel not found. Please contact an administrator.',
            ephemeral: true
        });
    }

    try {
        await logChannel.send({ embeds: [logEmbed] });
    } catch (error) {
        console.error(`Error sending log to channel: ${error}`);
        return interaction.reply({
            content: 'There was an error sending the log to the log channel.',
            ephemeral: true
        });
    }

    // Delete channel
    try {
        await channel.delete();
    } catch (error) {
        console.error(`Error deleting channel: ${error}`);
        return interaction.reply({
            content: 'There was an error closing the staff application.',
            ephemeral: true
        });
    }
}

/**
 * Helper to fetch all messages in a channel.
 */
async function fetchAllMessages(channel) {
    let messages = [];
    let lastId;

    while (true) {
        const options = { limit: 100 };
        if (lastId) {
            options.before = lastId;
        }

        const fetched = await channel.messages.fetch(options);
        if (fetched.size === 0) {
            break;
        }

        messages.push(...fetched.values());
        lastId = fetched.last().id;
    }

    return messages;
}

module.exports = {
    initiateClosureConfirmation,
    closeStaffApplication,
    fetchAllMessages
};
