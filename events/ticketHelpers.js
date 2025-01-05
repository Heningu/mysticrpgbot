/******************/
/* ticketHelpers.js */
/******************/
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType
} = require('discord.js');
const config = require('../data/config.json');

/**
 * Initiates the closure confirmation for tickets.
 */
async function initiateClosureConfirmation(interaction) {
    const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Confirm Ticket Closure')
        .setDescription('Are you sure you want to close this ticket?')
        .setColor(0xffa500)
        .setTimestamp();

    const confirmButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('confirmCloseTicket')
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cancelCloseTicket')
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
 * Closes a ticket by logging its messages and then deleting the channel.
 */
async function closeTicket(interaction, client) {
    const channel = interaction.channel;
    const guild = interaction.guild;
    const logChannelId = config.logChannelId;

    // Fetch all messages for logging
    let messages;
    try {
        messages = await fetchAllMessages(channel);
    } catch (error) {
        console.error(`Error fetching messages: ${error}`);
        return interaction.reply({
            content: 'There was an error fetching the ticket logs.',
            ephemeral: true
        });
    }

    const logContent = messages
        .reverse()
        .map((msg) => `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content}`)
        .join('\n');

    const logEmbed = new EmbedBuilder()
        .setTitle(`📝 Ticket Closed: ${channel.name}`)
        .addFields(
            { name: 'Closed By', value: interaction.user.tag, inline: true },
            { name: 'Ticket Creator', value: `<@${channel.topic}>`, inline: true },
            {
                name: 'Log',
                value: logContent.length > 4096 ? logContent.substring(0, 4093) + '...' : logContent
            }
        )
        .setColor(0xff0000)
        .setTimestamp();

    const logChannel = guild.channels.cache.get(logChannelId);

    if (!logChannel || logChannel.type !== ChannelType.GuildText) {
        console.error(`Log channel not found or is not a text channel.`);
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

    // Delete the ticket channel
    try {
        await channel.delete();
    } catch (error) {
        console.error(`Error deleting channel: ${error}`);
        return interaction.reply({
            content: 'There was an error closing the ticket.',
            ephemeral: true
        });
    }
}

/**
 * Fetches all messages from a channel, up to Discord's limit.
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
    closeTicket,
    fetchAllMessages
};
