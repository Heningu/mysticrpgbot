// commands/sendembed.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sendembed')
        .setDescription('Sends an embedded message')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of embed to send')
                .setRequired(true)
                .addChoices(
                    { name: 'Rules', value: 'rules' },
                    { name: 'Info', value: 'info' },
                    { name: 'HTC', value: 'htc' }
                )
        ),
    async execute(interaction) {
        const adminRoleId = '1273989601102532608'; // Replace with your actual admin role ID

        if (!interaction.member.roles.cache.has(adminRoleId)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        const type = interaction.options.getString('type');

        let embed;
        if (type === 'rules') {
            embed = new EmbedBuilder()
                .setTitle('📜 **Server Rules**')
                .setDescription(`
**1. Respect Everyone**
- Treat all members with kindness and respect. Personal attacks, insults, or derogatory language towards others are not allowed.

**2. No Spamming**
- Avoid sending repetitive messages, excessive emojis, or any form of spam that disrupts the flow of conversation.

**3. Appropriate Content Only**
- Keep all discussions and shared content appropriate for all members. This includes refraining from sharing explicit, violent, or otherwise unsuitable material.

**4. Use Appropriate Channels**
- Post content in the designated channels. Off-topic discussions should be moved to the appropriate sections to keep channels organized.

**5. No Advertising or Self-Promotion**
- Do not advertise other servers, services, or products without prior permission from the server administrators.

**6. Protect Privacy**
- Do not share personal information of yourself or others. This includes real names, addresses, phone numbers, and other sensitive data.

**7. Follow Discord's Terms of Service**
- Ensure all activities and content comply with [Discord's Terms of Service](https://discord.com/terms) and [Community Guidelines](https://discord.com/guidelines).

**8. No Illegal Activities**
- Discussions or promotions of illegal activities, including sharing pirated content or hacking, are strictly prohibited.

**9. Respect Staff Decisions**
- The server staff has the final say in enforcing rules. Respect their decisions and follow their instructions without argument.

**10. No NSFW Content**
- Sharing Not Safe For Work (NSFW) content is forbidden. This includes explicit images, links, or discussions that are inappropriate for general audiences.

**11. Use English Only**
- To maintain clear communication, please use English in all public channels unless otherwise specified.

**12. No Impersonation**
- Do not impersonate other members, staff, or public figures. This includes using similar usernames or avatars to deceive others.

**13. Report Issues Privately**
- If you encounter any problems or witness rule violations, contact the server staff privately instead of addressing it publicly.

**14. Stay On Topic**
- Keep discussions relevant to the channel's purpose. Avoid derailing conversations with unrelated topics.

**15. Be Mindful of Language**
- Use appropriate language and avoid excessive profanity. Offensive language may lead to warnings or disciplinary action.
                `)
                .setColor(0xFF0000) // Red color for rules
                .setTimestamp()
                .setFooter({ text: 'Please adhere to these rules to maintain a friendly and respectful community.' });
        } else if (type === 'info') {
            embed = new EmbedBuilder()
                .setTitle('ℹ️ **Server Information**')
                .setDescription(`
**🎮 About Us**
Welcome to the official **MysticRPG Server**! This Discord server is intricately connected to our MMORPG Minecraft Server **Xaru**, providing you with a hub for all things related to our gaming community.

**🛠️ What We Offer**
- **Patch Notes & Updates:** Stay informed with the latest updates and patch notes for both the server and our custom plugin.
- **Unique Features Showcase:** Explore and discuss the unique features that sets us apart from other Minecraft servers.
- **Support & Reporting:** Have a question, found a bug, or discovered an exploit? Report it here, and our team will assist you promptly while being rewarded.

**🚀 Join Our Team**
Interested in shaping the future of **Xaru**? Apply to join our **staff team** and contribute to building our unique and thriving community.

**🔄 Community Activities**
- **Trade & Market:** Easily trade items with fellow members and find what you need.
- **Quest Assistance:** Get help with quests and team up with others to conquer challenges.
- **Dungeon Groups:** Form or join dungeon groups to tackle epic adventures together.
- **Leaderboards:** Check out the leaderboards to see top players and compete for the top spot.
- **Suggestions & Feedback:** Have ideas to improve the server or plugins? Share your suggestions and help us enhance your gaming experience.
- **Account Linking:** Seamlessly link your in-game account to your Discord account for a more integrated experience.

**📢 Stay Connected**
Make sure to read the appropriate channels to understand the requirements and guidelines before diving into any activities. Your journey in **Xaru** starts here!

**🔗 Useful Links**
- [Server Website](https://xaru.eu)
- [Our Store | Cosmetics only & not finished](https://discord.gg/)
- <#1266165777409511475>

**🌟 Welcome to the MysticRPG family! We're excited to have you with us. Let's embark on this adventure together!**
                `)
                .setColor(0x00AE86) // Green color for info
                .setTimestamp()
                .setFooter({ text: 'Enjoy your stay and have fun!' });
        } else if (type === 'htc') {
            embed = new EmbedBuilder()
                .setTitle('🔌 **How-To-Connect to the Server**')
                .setDescription(`
**📢 Attention All Members!**

As we continue to develop and enhance our MMORPG Minecraft Server **Xaru**, access is currently restricted to **staff members only**. This is to ensure a stable and controlled environment as we implement new features and improvements.

**🛠️ Why Limited Access?**
- **Development Phase:** We're actively working on building and refining unique aspects of our server to provide an unparalleled gaming experience.
- **Quality Assurance:** By limiting access, we can better manage testing and address any issues that arise during development.

**📅 What's Next?**
We understand the excitement and eagerness to join the adventure! Stay tuned for our upcoming announcement regarding the **start date for the closed-testing phase**. This phase will allow a select group of members to experience the server before its official launch.

**🔔 Stay Informed:**
- **Announcements Channel:** Keep an eye on the <#1275029908929646704> channel for the latest updates and important information.
- **Server Website:** Visit our [Server Website](https://xaru.eu) for detailed guides and resources on connecting to the server.
- **Support Team:** If you have any questions or need assistance, feel free to reach out to our support team with a ticket.

**🌟 We Appreciate Your Patience!**
Thank you for your understanding and support as we work diligently to create an engaging and dynamic gaming environment. We can't wait to share the full experience with you soon!

**🚀 Get Ready for an Epic Journey with MysticRPG and Xaru!**
                `)
                .setColor(0x0000FF) // Blue color for HTC
                .setTimestamp()
                .setFooter({ text: 'Stay tuned for exciting updates!' });
        }

        try {
            // Send the embed directly to the channel without indicating the command was used
            await interaction.channel.send({ embeds: [embed] });

            // Acknowledge the interaction with an ephemeral message to the user
            await interaction.reply({ content: 'Embed has been sent successfully!', ephemeral: true });
        } catch (error) {
            console.error(`Error sending embed: ${error}`);
            await interaction.reply({ content: 'There was an error sending the embed.', ephemeral: true });
        }
    },
};
