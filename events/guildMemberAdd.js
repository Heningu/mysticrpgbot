const config = require('../data/config.json');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const newMemberRoleName = config.newMemberRoleName || 'Adventurer';
        const role = member.guild.roles.cache.find(r => r.name === newMemberRoleName);

        if (role) {
            try {
                await member.roles.add(role);
                console.log(`Assigned role ${role.name} to ${member.user.tag}`);
            } catch (error) {
                console.error(`Failed to assign role: ${error}`);
            }
        } else {
            console.log(`Role "${newMemberRoleName}" not found`);
        }
    },
};
