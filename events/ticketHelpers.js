// events/ticketHelpers.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

/**
 * Function to initiate closure confirmation for tickets.
 * @param {Interaction} interaction - The interaction that triggered the closure.
 * @param {string} closedBy - Who initiated the closure ('Staff' or 'User').
 */
async function initiateClosureConfirmation(interaction, closedBy) {
    const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Confirm Ticket Closure')
        .setDescription('Are you sure you want to close this ticket?')
        .setColor(0xFFA500)
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

    await interaction.reply({ embeds: [confirmEmbed], components: [confirmButtons], ephemeral: true });
}

/**
 * Function to close a ticket by deleting the channel and logging the details.
 * @param {Interaction} interaction - The interaction that triggered the closure.
 * @param {Client} client - The Discord client.
 */
async function closeTicket(interaction, client) {
    const channel = interaction.channel;
    const guild = interaction.guild;

    // Fetch all messages from the channel
    let messages;
    try {
        messages = await fetchAllMessages(channel);
    } catch (error) {
        console.error(`Error fetching messages: ${error}`);
        await interaction.reply({ content: 'There was an error fetching the ticket logs.', ephemeral: true });
        return;
    }

    // Format messages into a single string
    const logContent = messages
        .reverse() // Show oldest first
        .map(msg => `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content}`)
        .join('\n');

    // Create an embed for the log
    const logEmbed = new EmbedBuilder()
        .setTitle(`📝 Ticket Closed: ${channel.name}`)
        .addFields(
            { name: 'Closed By', value: interaction.user.tag, inline: true },
            { name: 'Ticket Creator', value: `<@${channel.topic}>`, inline: true },
            { name: 'Log', value: logContent.length > 4096 ? logContent.substring(0, 4093) + '...' : logContent }
        )
        .setColor(0xFF0000) // Red for closure
        .setTimestamp();

    // Define the log channel ID
    const logChannelId = '1275231946380808294'; // Replace with your actual log channel ID
    const logChannel = guild.channels.cache.get(logChannelId);

    if (!logChannel || logChannel.type !== ChannelType.GuildText) {
        console.error(`Log channel not found or is not a text channel.`);
        await interaction.reply({ content: 'Log channel not found. Please contact an administrator.', ephemeral: true });
        return;
    }

    try {
        await logChannel.send({ embeds: [logEmbed] });
    } catch (error) {
        console.error(`Error sending log to channel: ${error}`);
        await interaction.reply({ content: 'There was an error sending the log to the log channel.', ephemeral: true });
        return;
    }

    // Delete the ticket channel
    try {
        await channel.delete();
    } catch (error) {
        console.error(`Error deleting channel: ${error}`);
        await interaction.reply({ content: 'There was an error closing the ticket.', ephemeral: true });
    }
}

/**
 * Fetches all messages from a channel.
 * @param {TextChannel} channel - The channel to fetch messages from.
 * @returns {Promise<Array<Message>>} - An array of messages.
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
