// events/temporaryVoice.js

const { Events, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        // Configuration
        const MAIN_VOICE_CHANNEL_ID = '1275228273051439144'; // The voice channel to monitor
        const CATEGORY_ID = '1275228054481801306'; // The category to create new channels in

        // User joined the main voice channel
        if (
            oldState.channelId !== MAIN_VOICE_CHANNEL_ID && // User was not previously in the main channel
            newState.channelId === MAIN_VOICE_CHANNEL_ID // User has joined the main channel
        ) {
            console.log(`${newState.member.user.tag} joined the main voice channel.`);

            const guild = newState.guild;
            const member = newState.member;

            // Fetch the category channel
            const category = guild.channels.cache.get(CATEGORY_ID);
            if (!category || category.type !== ChannelType.GuildCategory) {
                console.error(`Category with ID ${CATEGORY_ID} not found or is not a category.`);
                return;
            }

            // Define the name for the new temporary voice channel
            const channelName = `vc-${member.user.username}`;

            try {
                // Create the new temporary voice channel with appropriate permissions
                const tempVoiceChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildVoice,
                    parent: CATEGORY_ID,
                    permissionOverwrites: [
                        {
                            id: guild.id, // @everyone
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.Connect,
                            ],
                            deny: [
                                // Optionally, deny other permissions if needed
                            ],
                        },
                        {
                            id: member.id, // The user who joined
                            allow: [
                                PermissionsBitField.Flags.ManageChannels, // Allows renaming and changing user limit
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.Connect,
                            ],
                            deny: [
                                // Optionally, deny other permissions if needed
                            ],
                        },
                    ],
                });

                // Move the user to the newly created temporary voice channel
                await member.voice.setChannel(tempVoiceChannel);

                console.log(`Created temporary voice channel "${tempVoiceChannel.name}" for ${member.user.tag}`);
            } catch (error) {
                console.error(`Failed to create or move to temporary voice channel: ${error}`);
                await member.send('Sorry, I couldn\'t create a temporary voice channel for you.');
            }
        }

        // User left a voice channel
        // Check if the channel is a temporary voice channel (name starts with 'vc-')
        if (
            oldState.channel && // User was previously in a channel
            oldState.channel.name.startsWith('vc-') && // The channel name starts with 'vc-'
            oldState.channel.members.size === 0 // No members left in the channel
        ) {
            const channel = oldState.channel;

            console.log(`User left temporary voice channel "${channel.name}". Checking if it's empty.`);

            try {
                await channel.delete();
                console.log(`Deleted empty temporary voice channel "${channel.name}"`);
            } catch (error) {
                console.error(`Failed to delete temporary voice channel "${channel.name}": ${error}`);
            }
        }
    },
};
