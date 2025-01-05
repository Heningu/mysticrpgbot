/***********************/
/* temporaryVoice.js   */
/***********************/
const { Events, ChannelType, PermissionsBitField } = require('discord.js');
const config = require('../data/config.json');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const { mainVoiceChannelId, categoryId } = config.voiceChannel;

        // User joined the main voice channel
        if (
            oldState.channelId !== mainVoiceChannelId &&
            newState.channelId === mainVoiceChannelId
        ) {
            console.log(`${newState.member.user.tag} joined the main voice channel.`);

            const guild = newState.guild;
            const member = newState.member;
            const category = guild.channels.cache.get(categoryId);

            if (!category || category.type !== ChannelType.GuildCategory) {
                console.error(`Category with ID ${categoryId} not found or is not a category.`);
                return;
            }

            const channelName = `vc-${member.user.username}`;

            try {
                // Create new temporary voice channel
                const tempVoiceChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: guild.id, // @everyone
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.Connect
                            ]
                        },
                        {
                            id: member.id, // The user who joined
                            allow: [
                                PermissionsBitField.Flags.ManageChannels,
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.Connect
                            ]
                        }
                    ]
                });

                // Move the user into the newly created channel
                await member.voice.setChannel(tempVoiceChannel);
                console.log(
                    `Created temporary voice channel "${tempVoiceChannel.name}" for ${member.user.tag}`
                );
            } catch (error) {
                console.error(`Failed to create/move to temporary voice channel: ${error}`);
                await member.send("Sorry, I couldn't create a temporary voice channel for you.");
            }
        }

        // User left a voice channel
        if (
            oldState.channel &&
            oldState.channel.name.startsWith('vc-') &&
            oldState.channel.members.size === 0
        ) {
            const channel = oldState.channel;
            console.log(`Channel "${channel.name}" is empty. Deleting...`);

            try {
                await channel.delete();
                console.log(`Deleted empty temporary voice channel "${channel.name}"`);
            } catch (error) {
                console.error(
                    `Failed to delete temporary voice channel "${channel.name}": ${error}`
                );
            }
        }
    }
};
