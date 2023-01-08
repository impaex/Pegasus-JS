const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolemenu')
        .setDescription('Tweaks rolemenus.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Enables a rolemenu in a server')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Title of the rolemenu')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('destination')
                        .setDescription('Where to place the rolemenu (leave blank to use current channel)')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disables an active rolemenu.')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Title of the rolemenu to disable')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a rolemenu.')
                .addStringOption(option =>
                    option
                        .setName('title')
                        .setDescription('Set a unique title for your rolemenu')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('Set a (optional) description for your rolemenu')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a rolemenu.')
                .addStringOption(option =>
                    option
                        .setName('title')
                        .setDescription('The title of the rolemenu to remove')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing rolemenu. The title cannot be edited')
                .addStringOption(option =>
                    option
                        .setName('title')
                        .setDescription('Title of rolemenu to edit')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('Enter the new rolemenu description')
                        .setRequired(false)))
    ,
    async execute(interaction, dbClient) {
        // exec here
    },
};