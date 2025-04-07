
const applyExtraSetup = (sequelize) => {
    const {
        Users,
        Groups,
        GroupMembers,
        Friends,
        FriendInvitations,
        // PrivateMessages,
        // GroupMessages,
        Attachments,

    } = sequelize.models;

    Users.belongsToMany(Groups, { through: GroupMembers });
    Groups.belongsToMany(Users, { through: GroupMembers });

    Users.belongsToMany(Users, {
        through: Friends,
        as: 'friends',
        foreignKey: 'userId',
    });
    Users.belongsToMany(Users, {
        through: Friends,
        as: 'theirFriends',
        foreignKey: 'friendId',
    });

    Users.belongsToMany(Users, {
        through: {
            model: FriendInvitations,
            unique: false,
        },
        as: 'inviters', // 自己邀请他人
        foreignKey: 'applicantId',
    });
    Users.belongsToMany(Users, {
        through: {
            model: FriendInvitations,
            unique: false,
        },
        as: 'invitees', // 他人邀请自己
        foreignKey: 'recipientId',
    });

    // Users.hasMany(PrivateMessages, { foreignKey: 'senderId' });
    // Users.hasMany(PrivateMessages, { foreignKey: 'recipientId' });
    // PrivateMessages.belongsTo(Users);

    // Users.hasMany(GroupMessages, { foreignKey: 'senderId' });
    // Users.hasMany(GroupMessages, { foreignKey: 'groupId' });
    // GroupMessages.belongsTo(Users);

    Users.hasMany(Attachments, { foreignKey: 'userId' });
    Attachments.belongsTo(Users, { foreignKey: 'userId' });

    Users.belongsTo(Attachments, { foreignKey: 'avatarId' });
}

module.exports = applyExtraSetup;
