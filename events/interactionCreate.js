/*********************/
/* interactionCreate.js */
/*********************/
const {
    Events,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder
} = require('discord.js');

const { initiateClosureConfirmation, closeTicket } = require('./ticketHelpers');
const {
    initiateClosureConfirmation: initiateStaffClosureConfirmation,
    closeStaffApplication
} = require('./staffHelpers');
const config = require('../data/config.json');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}`);
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: 'There was an error while executing this command!',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: 'There was an error while executing this command!',
                        ephemeral: true
                    });
                }
            }
        }

        // Button Interactions
        else if (interaction.isButton()) {
            const { customId } = interaction;

            // Create Support Ticket
            if (customId === 'createSupportTicket') {
                // Check for existing ticket
                const existingTicket = interaction.guild.channels.cache.find(
                    (channel) =>
                        channel.name.startsWith('ticket-') && channel.topic === interaction.user.id
                );
                if (existingTicket) {
                    return interaction.reply({
                        content: `You already have an open ticket: <#${existingTicket.id}>`,
                        ephemeral: true
                    });
                }

                // Show modal for ticket creation
                const modal = new ModalBuilder()
                    .setCustomId('supportTicketModal')
                    .setTitle('Create a Support Ticket');

                const titleInput = new TextInputBuilder()
                    .setCustomId('ticketTitle')
                    .setLabel("What's your issue about?")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('Enter a brief title for your issue');

                const descriptionInput = new TextInputBuilder()
                    .setCustomId('ticketDescription')
                    .setLabel('Please describe your issue in detail.')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setPlaceholder('Provide a detailed description of your issue');

                const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
                const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);

                modal.addComponents(firstActionRow, secondActionRow);
                await interaction.showModal(modal);
            }

            // Close Ticket (Staff button)
            else if (customId === 'closeTicket') {
                const staffRole = interaction.guild.roles.cache.find(
                    (role) => role.name === config.staffRoleName
                );
                if (!staffRole) {
                    return interaction.reply({
                        content: 'Staff role not found. Please contact an administrator.',
                        ephemeral: true
                    });
                }

                if (
                    !interaction.member.roles.cache.has(staffRole.id) &&
                    !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
                ) {
                    return interaction.reply({
                        content: 'You do not have permission to close this ticket.',
                        ephemeral: true
                    });
                }

                await initiateClosureConfirmation(interaction);
            }

            // Self Close Ticket
            else if (customId === 'selfCloseTicket') {
                const channel = interaction.channel;
                // If it's a ticket
                if (channel.name.startsWith('ticket-')) {
                    const creatorId = channel.topic;
                    if (!creatorId) {
                        return interaction.reply({
                            content: 'Cannot determine the ticket creator.',
                            ephemeral: true
                        });
                    }
                    if (interaction.user.id !== creatorId) {
                        return interaction.reply({
                            content: 'You can only close your own ticket.',
                            ephemeral: true
                        });
                    }
                    await initiateClosureConfirmation(interaction);
                }
                // If it's a staff application
                else if (channel.name.startsWith('staff-application-')) {
                    const applicantId = channel.topic;
                    if (!applicantId) {
                        return interaction.reply({
                            content: 'Cannot determine the applicant.',
                            ephemeral: true
                        });
                    }
                    if (interaction.user.id !== applicantId) {
                        return interaction.reply({
                            content: 'You can only close your own staff application.',
                            ephemeral: true
                        });
                    }
                    await initiateStaffClosureConfirmation(interaction);
                }
            }

            // Confirm/Cancel Ticket Closure
            else if (customId === 'confirmCloseTicket') {
                await closeTicket(interaction, client);
            } else if (customId === 'cancelCloseTicket') {
                await interaction.reply({
                    content: 'Ticket closure has been canceled.',
                    ephemeral: true
                });
            }

            // Create Staff Application
            else if (customId === 'createStaffApplication') {
                const existingApplication = interaction.guild.channels.cache.find(
                    (channel) =>
                        channel.name.startsWith('staff-application-') &&
                        channel.topic === interaction.user.id
                );

                if (existingApplication) {
                    return interaction.reply({
                        content: `You already have an open staff application: <#${existingApplication.id}>`,
                        ephemeral: true
                    });
                }

                // Show modal for staff application
                const modal = new ModalBuilder()
                    .setCustomId('staffApplicationModal')
                    .setTitle('Staff Application');

                const applicationTypeInput = new TextInputBuilder()
                    .setCustomId('applicationType')
                    .setLabel('Which position are you applying for?')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('Support, Builder, or Media');

                const instructionsInput = new TextInputBuilder()
                    .setCustomId('applicationInstructions')
                    .setLabel('Additional Information')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false)
                    .setPlaceholder('Provide any additional info or questions you might have.');

                const firstActionRow = new ActionRowBuilder().addComponents(applicationTypeInput);
                const secondActionRow = new ActionRowBuilder().addComponents(instructionsInput);

                modal.addComponents(firstActionRow, secondActionRow);
                await interaction.showModal(modal);
            }

            // Close Staff Application (Staff button)
            else if (customId === 'closeStaffApplication') {
                const staffRole = interaction.guild.roles.cache.find(
                    (role) => role.name === config.staffRoleName
                );
                if (!staffRole) {
                    return interaction.reply({
                        content: 'Staff role not found. Please contact an administrator.',
                        ephemeral: true
                    });
                }

                if (
                    !interaction.member.roles.cache.has(staffRole.id) &&
                    !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
                ) {
                    return interaction.reply({
                        content: 'You do not have permission to close this staff application.',
                        ephemeral: true
                    });
                }

                await initiateStaffClosureConfirmation(interaction);
            }

            // Confirm/Cancel Staff App Closure
            else if (customId === 'confirmCloseStaffApp') {
                await closeStaffApplication(interaction, client);
            } else if (customId === 'cancelCloseStaffApp') {
                await interaction.reply({
                    content: 'Staff application closure has been canceled.',
                    ephemeral: true
                });
            }
        }

        // Modal Submissions
        else if (interaction.isModalSubmit()) {
            const { customId } = interaction;

            // --- SUPPORT TICKET MODAL ---
            if (customId === 'supportTicketModal') {
                const title = interaction.fields.getTextInputValue('ticketTitle');
                const description = interaction.fields.getTextInputValue('ticketDescription');

                const category = interaction.guild.channels.cache.find(
                    (ch) => ch.name === 'Tickets' && ch.type === ChannelType.GuildCategory
                );
                if (!category) {
                    return interaction.reply({
                        content: 'Tickets category does not exist. Please contact an administrator.',
                        ephemeral: true
                    });
                }

                const channelName = `ticket-${interaction.user.username.toLowerCase()}-${interaction.user.discriminator}`;
                const existingTicket = interaction.guild.channels.cache.find(
                    (ch) => ch.name === channelName && ch.topic === interaction.user.id
                );
                if (existingTicket) {
                    return interaction.reply({
                        content: `You already have an open ticket: <#${existingTicket.id}>`,
                        ephemeral: true
                    });
                }

                try {
                    const staffRole = interaction.guild.roles.cache.find(
                        (role) => role.name === config.staffRoleName
                    );
                    if (!staffRole) {
                        return interaction.reply({
                            content: 'Support role not found. Please contact an administrator.',
                            ephemeral: true
                        });
                    }

                    const ticketChannel = await interaction.guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        parent: category.id,
                        topic: interaction.user.id,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.roles.everyone.id,
                                deny: [PermissionFlagsBits.ViewChannel]
                            },
                            {
                                id: interaction.user.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory,
                                    PermissionFlagsBits.AttachFiles
                                ]
                            },
                            {
                                id: staffRole.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory,
                                    PermissionFlagsBits.AttachFiles
                                ]
                            }
                        ]
                    });

                    // Build the embed
                    const ticketEmbed = new EmbedBuilder()
                        .setTitle(`🎫 Support Ticket: ${title}`)
                        .setDescription(description)
                        .setColor(0x0099ff)
                        .setFooter({
                            text: `User: ${interaction.user.tag}`,
                            iconURL: interaction.user.displayAvatarURL()
                        })
                        .setTimestamp();

                    const closeButtons = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('closeTicket')
                            .setLabel('Close Ticket (Staff)')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('selfCloseTicket')
                            .setLabel('Close Ticket')
                            .setStyle(ButtonStyle.Secondary)
                    );

                    // PING the ticket creator + Staff role
                    await ticketChannel.send({
                        content: `<@${interaction.user.id}> A new ticket has been created!\n<@&1273989063623315456>`,
                        embeds: [ticketEmbed],
                        components: [closeButtons]
                    });

                    await interaction.reply({
                        content: `Your support ticket has been created: <#${ticketChannel.id}>`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error(`Error creating support ticket: ${error}`);
                    await interaction.reply({
                        content: 'There was an error creating your ticket. Please try again later.',
                        ephemeral: true
                    });
                }
            }

            // --- STAFF APPLICATION MODAL ---
            else if (customId === 'staffApplicationModal') {
                const applicationType = interaction.fields
                    .getTextInputValue('applicationType')
                    .toLowerCase();
                const additionalInfo =
                    interaction.fields.getTextInputValue('applicationInstructions') ||
                    'No additional information provided.';

                const validTypes = ['support', 'builder', 'media'];
                if (!validTypes.includes(applicationType)) {
                    return interaction.reply({
                        content: 'Invalid application type. Please choose Support, Builder, or Media.',
                        ephemeral: true
                    });
                }

                const category = interaction.guild.channels.cache.find(
                    (ch) => ch.name === 'Staff Applications' && ch.type === ChannelType.GuildCategory
                );
                if (!category) {
                    return interaction.reply({
                        content: 'Staff Applications category does not exist. Please contact an administrator.',
                        ephemeral: true
                    });
                }

                const channelName = `staff-application-${interaction.user.username.toLowerCase()}-${interaction.user.discriminator}`;
                const existingApplication = interaction.guild.channels.cache.find(
                    (ch) => ch.name === channelName && ch.topic === interaction.user.id
                );

                if (existingApplication) {
                    return interaction.reply({
                        content: `You already have an open staff application: <#${existingApplication.id}>`,
                        ephemeral: true
                    });
                }

                try {
                    const staffRole = interaction.guild.roles.cache.find(
                        (role) => role.name === config.staffRoleName
                    );
                    if (!staffRole) {
                        return interaction.reply({
                            content: 'Support role not found. Please contact an administrator.',
                            ephemeral: true
                        });
                    }

                    const staffChannel = await interaction.guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        parent: category.id,
                        topic: interaction.user.id,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.roles.everyone.id,
                                deny: [PermissionFlagsBits.ViewChannel]
                            },
                            {
                                id: interaction.user.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory,
                                    PermissionFlagsBits.AttachFiles
                                ]
                            },
                            {
                                id: staffRole.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory,
                                    PermissionFlagsBits.AttachFiles
                                ]
                            }
                        ]
                    });

                    const applicationEmbed = new EmbedBuilder()
                        .setTitle(
                            `📄 Staff Application: ${
                                applicationType.charAt(0).toUpperCase() + applicationType.slice(1)
                            }`
                        )
                        .setDescription(additionalInfo)
                        .setColor(0x00ae86)
                        .setFooter({
                            text: `Applicant: ${interaction.user.tag}`,
                            iconURL: interaction.user.displayAvatarURL()
                        })
                        .setTimestamp();

                    const closeButtons = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('closeStaffApplication')
                            .setLabel('Close Application (Staff)')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            // Re-using selfCloseTicket for user closure
                            .setCustomId('selfCloseTicket')
                            .setLabel('Close Application')
                            .setStyle(ButtonStyle.Secondary)
                    );

                    // PING the applicant + Staff role
                    await staffChannel.send({
                        content: `<@${interaction.user.id}> A new staff application has been created!\n<@&1273989063623315456>`,
                        embeds: [applicationEmbed],
                        components: [closeButtons]
                    });

                    await interaction.reply({
                        content: `Your staff application has been submitted: <#${staffChannel.id}>`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error(`Error creating staff application: ${error}`);
                    await interaction.reply({
                        content: 'There was an error creating your staff application. Please try again later.',
                        ephemeral: true
                    });
                }
            }
        }
    }
};
