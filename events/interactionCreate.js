// events/interactionCreate.js

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
    EmbedBuilder,
    AttachmentBuilder
} = require('discord.js');

const {
    initiateClosureConfirmation,
    closeTicket,
    fetchAllMessages
} = require('./ticketHelpers');

const {
    initiateClosureConfirmation: initiateStaffClosureConfirmation,
    closeStaffApplication,
    fetchAllMessages: fetchStaffMessages
} = require('./staffHelpers');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
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
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        }
        else if (interaction.isButton()) {
            const { customId } = interaction;

            // Handle Support Ticket Creation
            if (customId === 'createSupportTicket') {
                // Check if the user already has an open ticket
                const existingTicket = interaction.guild.channels.cache.find(channel =>
                    channel.name.startsWith('ticket-') &&
                    channel.topic === interaction.user.id
                );

                if (existingTicket) {
                    return interaction.reply({
                        content: `You already have an open ticket: <#${existingTicket.id}>`,
                        ephemeral: true
                    });
                }

                // Proceed to show the modal for ticket creation
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

            // Handle Staff Application Creation
            else if (customId === 'createStaffApplication') {
                // Check if the user already has an open staff application
                const existingApplication = interaction.guild.channels.cache.find(channel =>
                    channel.name.startsWith('staff-application-') &&
                    channel.topic === interaction.user.id
                );

                if (existingApplication) {
                    return interaction.reply({
                        content: `You already have an open staff application: <#${existingApplication.id}>`,
                        ephemeral: true
                    });
                }

                // Proceed to show the modal for staff application
                const modal = new ModalBuilder()
                    .setCustomId('staffApplicationModal')
                    .setTitle('Staff Application');

                const applicationTypeInput = new TextInputBuilder()
                    .setCustomId('applicationType')
                    .setLabel("Which position are you applying for?")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('Support, Builder, or Media');

                const instructionsInput = new TextInputBuilder()
                    .setCustomId('applicationInstructions')
                    .setLabel('Additional Information')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false)
                    .setPlaceholder('Provide any additional information or questions you might have.');

                const firstActionRow = new ActionRowBuilder().addComponents(applicationTypeInput);
                const secondActionRow = new ActionRowBuilder().addComponents(instructionsInput);

                modal.addComponents(firstActionRow, secondActionRow);

                await interaction.showModal(modal);
            }

            // Handle Ticket Closure by Staff
            else if (customId === 'closeTicket') {
                // Check if the user has the 'Ticket-Support' role or is an admin
                const staffRole = interaction.guild.roles.cache.find(role => role.name === 'Ticket-Support'); // Replace with your staff role name
                if (!staffRole) {
                    return interaction.reply({ content: 'Staff role not found. Please contact an administrator.', ephemeral: true });
                }

                const member = interaction.member;

                if (!member.roles.cache.has(staffRole.id) && !member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({ content: 'You do not have permission to close this ticket.', ephemeral: true });
                }

                // Proceed to initiate the closure confirmation
                await initiateClosureConfirmation(interaction, 'Staff');
            }

            // Handle Staff Application Closure by Staff
            else if (customId === 'closeStaffApplication') {
                // Check if the user has the 'Ticket-Support' role or is an admin
                const staffRole = interaction.guild.roles.cache.find(role => role.name === 'Ticket-Support'); // Replace with your staff role name
                if (!staffRole) {
                    return interaction.reply({ content: 'Staff role not found. Please contact an administrator.', ephemeral: true });
                }

                const member = interaction.member;

                if (!member.roles.cache.has(staffRole.id) && !member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({ content: 'You do not have permission to close this staff application.', ephemeral: true });
                }

                // Proceed to initiate the closure confirmation for staff application
                await initiateStaffClosureConfirmation(interaction, 'Staff');
            }

            // Handle Ticket Closure by User
            else if (customId === 'selfCloseTicket') {
                const channel = interaction.channel;

                // Determine if it's a ticket or staff application based on channel name
                if (channel.name.startsWith('ticket-')) {
                    // Handle Ticket Closure by User
                    const creatorId = channel.topic; // Assuming you store the creator's ID in the channel topic
                    if (!creatorId) {
                        return interaction.reply({ content: 'Cannot determine the ticket creator.', ephemeral: true });
                    }

                    if (interaction.user.id !== creatorId) {
                        return interaction.reply({ content: 'You can only close your own ticket.', ephemeral: true });
                    }

                    // Proceed to initiate the closure confirmation for ticket
                    await initiateClosureConfirmation(interaction, 'User');
                }
                else if (channel.name.startsWith('staff-application-')) {
                    // Handle Staff Application Closure by User (if allowed)
                    const applicantId = channel.topic; // Assuming you store the applicant's ID in the channel topic
                    if (!applicantId) {
                        return interaction.reply({ content: 'Cannot determine the applicant.', ephemeral: true });
                    }

                    if (interaction.user.id !== applicantId) {
                        return interaction.reply({ content: 'You can only close your own staff application.', ephemeral: true });
                    }

                    // Proceed to initiate the closure confirmation for staff application
                    await initiateStaffClosureConfirmation(interaction, 'User');
                }
                else {
                    return interaction.reply({ content: 'This channel is not recognized for closure operations.', ephemeral: true });
                }
            }

            // Handle Confirmation Buttons for Ticket Closure
            else if (customId === 'confirmCloseTicket') {
                // Proceed to close the ticket
                await closeTicket(interaction, client);
            }
            else if (customId === 'cancelCloseTicket') {
                // Cancel the closure
                await interaction.reply({ content: 'Ticket closure has been canceled.', ephemeral: true });
            }

            // Handle Confirmation Buttons for Staff Application Closure
            else if (customId === 'confirmCloseStaffApp') {
                // Proceed to close the staff application
                await closeStaffApplication(interaction, client);
            }
            else if (customId === 'cancelCloseStaffApp') {
                // Cancel the closure
                await interaction.reply({ content: 'Staff application closure has been canceled.', ephemeral: true });
            }

            // Add more button handlers here if needed
        }
        else if (interaction.isModalSubmit()) {
            const { customId } = interaction;

            // Handle Support Ticket Modal Submission
            if (customId === 'supportTicketModal') {
                const title = interaction.fields.getTextInputValue('ticketTitle');
                const description = interaction.fields.getTextInputValue('ticketDescription');

                // Define the Tickets category
                const category = interaction.guild.channels.cache.find(channel => channel.name === 'Tickets' && channel.type === ChannelType.GuildCategory);
                if (!category) {
                    return interaction.reply({ content: 'Tickets category does not exist. Please contact an administrator.', ephemeral: true });
                }

                // Create a unique channel name
                const channelName = `ticket-${interaction.user.username.toLowerCase()}-${interaction.user.discriminator}`;

                // Check again to prevent race conditions
                const existingTicket = interaction.guild.channels.cache.find(channel =>
                    channel.name === channelName &&
                    channel.topic === interaction.user.id
                );

                if (existingTicket) {
                    return interaction.reply({
                        content: `You already have an open ticket: <#${existingTicket.id}>`,
                        ephemeral: true
                    });
                }

                // Create the ticket channel with appropriate permissions
                try {
                    const supportRole = interaction.guild.roles.cache.find(role => role.name === 'Ticket-Support'); // Replace with your support role name
                    if (!supportRole) {
                        return interaction.reply({ content: 'Support role not found. Please contact an administrator.', ephemeral: true });
                    }

                    const ticketChannel = await interaction.guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        parent: category.id,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.roles.everyone.id,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: interaction.user.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory,
                                    PermissionFlagsBits.AttachFiles, // Allow attaching files
                                ],
                            },
                            {
                                id: supportRole.id, // Support role
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory,
                                    PermissionFlagsBits.AttachFiles, // Allow attaching files
                                ],
                            },
                        ],
                    });

                    // Store the creator's ID in the channel topic for reference
                    await ticketChannel.setTopic(interaction.user.id);

                    // Create an embed for the ticket
                    const ticketEmbed = new EmbedBuilder()
                        .setTitle(`🎫 Support Ticket: ${title}`)
                        .setDescription(description)
                        .setColor(0x0099FF)
                        .setFooter({ text: `User: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                        .setTimestamp();

                    // Create close buttons
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

                    // Send the embed and buttons in the ticket channel
                    await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [closeButtons] });

                    // Acknowledge the modal submission
                    await interaction.reply({ content: `Your support ticket has been created: <#${ticketChannel.id}>`, ephemeral: true });
                } catch (error) {
                    console.error(`Error creating support ticket: ${error}`);
                    await interaction.reply({ content: 'There was an error creating your ticket. Please try again later.', ephemeral: true });
                }
            }

            // Handle Staff Application Modal Submission
            else if (customId === 'staffApplicationModal') {
                const applicationTypeInput = interaction.fields.getTextInputValue('applicationType').toLowerCase();
                const additionalInfo = interaction.fields.getTextInputValue('applicationInstructions');

                // Validate application type
                const validTypes = ['support', 'builder', 'media'];
                if (!validTypes.includes(applicationTypeInput)) {
                    return interaction.reply({ content: 'Invalid application type selected. Please choose Support, Builder, or Media.', ephemeral: true });
                }

                // Define the Staff Applications category
                const category = interaction.guild.channels.cache.find(channel => channel.name === 'Staff Applications' && channel.type === ChannelType.GuildCategory);
                if (!category) {
                    return interaction.reply({ content: 'Staff Applications category does not exist. Please contact an administrator.', ephemeral: true });
                }

                // Create a unique channel name
                const channelName = `staff-application-${interaction.user.username.toLowerCase()}-${interaction.user.discriminator}`;

                // Check again to prevent race conditions
                const existingApplication = interaction.guild.channels.cache.find(channel =>
                    channel.name === channelName &&
                    channel.topic === interaction.user.id
                );

                if (existingApplication) {
                    return interaction.reply({
                        content: `You already have an open staff application: <#${existingApplication.id}>`,
                        ephemeral: true
                    });
                }

                // Create the staff application channel with appropriate permissions
                try {
                    const supportRole = interaction.guild.roles.cache.find(role => role.name === 'Ticket-Support'); // Replace with your support role name
                    if (!supportRole) {
                        return interaction.reply({ content: 'Support role not found. Please contact an administrator.', ephemeral: true });
                    }

                    const staffChannel = await interaction.guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        parent: category.id,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.roles.everyone.id,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: interaction.user.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory,
                                    PermissionFlagsBits.AttachFiles, // Allow attaching files
                                ],
                            },
                            {
                                id: supportRole.id, // Support role
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory,
                                    PermissionFlagsBits.AttachFiles, // Allow attaching files
                                ],
                            },
                        ],
                    });

                    // Store the applicant's ID in the channel topic for reference
                    await staffChannel.setTopic(interaction.user.id);

                    // Create an embed for the staff application
                    const applicationEmbed = new EmbedBuilder()
                        .setTitle(`📄 Staff Application: ${applicationTypeInput.charAt(0).toUpperCase() + applicationTypeInput.slice(1)}`)
                        .setDescription(additionalInfo || 'No additional information provided.')
                        .setColor(0x00AE86)
                        .setFooter({ text: `Applicant: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                        .setTimestamp();

                    // Create close buttons
                    const closeButtons = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('closeStaffApplication')
                            .setLabel('Close Application (Staff)')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('selfCloseTicket') // Reuse selfCloseTicket for applicant
                            .setLabel('Close Application')
                            .setStyle(ButtonStyle.Secondary)
                    );

                    // Send the embed and buttons in the application channel
                    await staffChannel.send({ content: `<@${interaction.user.id}>`, embeds: [applicationEmbed], components: [closeButtons] });

                    // Acknowledge the modal submission
                    await interaction.reply({ content: `Your staff application has been submitted: <#${staffChannel.id}>`, ephemeral: true });
                } catch (error) {
                    console.error(`Error creating staff application: ${error}`);
                    await interaction.reply({ content: 'There was an error creating your staff application. Please try again later.', ephemeral: true });
                }
            }
        }
    }
};
