// events/guildMemberAdd.js
module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        const role = member.guild.roles.cache.find(r => r.name === 'Adventurer'); // Replace 'Member' with your role name
        if (role) {
            try {
                await member.roles.add(role);
                console.log(`Assigned role ${role.name} to ${member.user.tag}`);
            } catch (error) {
                console.error(`Failed to assign role: ${error}`);
            }
        } else {
            console.log('Role not found');
        }
    },
};
