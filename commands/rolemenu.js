const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const customEmbed = require('../helpers/customEmbed');

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
        if (interaction.options.getSubcommand() === 'enable') {
            let title = interaction.options.getString('title');

            let channel = interaction.options.getChannel('destination') ?? interaction.channel;
            let replyEmbed;

            const res = await dbClient.query("SELECT * FROM rolemenus WHERE guild_id = $1 AND title = $2", [interaction.guildId, title]);
            if (res.rowCount > 0) {
                const embed = customEmbed(res.rows[0].title, res.rows[0].description)
                let row = new ActionRowBuilder();
                for (let index = 0; index < res.rows[0].role_ids.length; index++) {
                    const role_id = res.rows[0].role_ids[index];
                    const button_title = res.rows[0].name_ids[index];
                    row
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`rolemenu${role_id}`)
                                .setLabel(button_title)
                                .setStyle(ButtonStyle.Primary),
                        );
                }

                let msg = await channel.send({ embeds: [embed], components: [row] });
                await dbClient.query("UPDATE rolemenus SET msg_id = $1, channel_id = $2 WHERE guild_id = $3 AND title = $4", [msg.id, channel.id, interaction.guildId, title]);
                replyEmbed = customEmbed("Rolemenu", `Successfully enabled rolemenu named \`${res.rows[0].title}\` in <#${channel.id}>.`);
            }
            else {
                replyEmbed = customEmbed("Rolemenu", "Couldn't find a rolemenu with that title!", 'ERROR')
            }
            await interaction.reply({ embeds: [replyEmbed] });
        }
        else if (interaction.options.getSubcommand() === 'disable') {
            let title = interaction.options.getString('title');
            const res = await dbClient.query("SELECT * FROM rolemenus WHERE guild_id = $1 AND title = $2", [interaction.guildId, title]);
            let replyEmbed;
            if (res.rowCount > 0) {
                let ch_id = res.rows[0].channel_id;
                let msg_id = res.rows[0].msg_id;

                // delete the rolemenu on discord
                await dbClient.query("UPDATE rolemenus SET msg_id = NULL, channel_id = NULL WHERE guild_id = $1 AND title = $2", [interaction.guildId, title]);
                let ch = await interaction.guild.channels.fetch(`${ch_id}`);
                
                await ch.messages.delete(`${msg_id}`); // Can error if messsage has been manually deleted.

                replyEmbed = customEmbed("Rolemenu", `Successfully disabled rolemenu named \`${res.rows[0].title}\`.`);
            }
            else {
                replyEmbed = customEmbed("Rolemenu", "Couldn't find a rolemenu with that title!", 'ERROR')
            }
            await interaction.reply({ embeds: [replyEmbed] });
        }
        else if (interaction.options.getSubcommand() === 'create') {
            let title = interaction.options.getString('title');


        }
        else if (interaction.options.getSubcommand() === 'delete') {
            let title = interaction.options.getString('title');
            const res = await dbClient.query("SELECT * FROM rolemenus WHERE guild_id = $1 AND title = $2", [interaction.guildId, title]);
            let replyEmbed;
            
            if (res.rowCount > 0) {
                let msg_id = res.rows[0].msg_id;
                // continue where left off
                if (msg_id === null) {}
                let ch_id = res.rows[0].channel_id;
                

                // delete the rolemenu on discord
                await dbClient.query("UPDATE rolemenus SET msg_id = NULL, channel_id = NULL WHERE guild_id = $1 AND title = $2", [interaction.guildId, title]);
                let ch = await interaction.guild.channels.fetch(`${ch_id}`);
                
                await ch.messages.delete(`${msg_id}`); // Can error if messsage has been manually deleted.

                replyEmbed = customEmbed("Rolemenu", `Successfully disabled rolemenu named \`${res.rows[0].title}\`.`);
            }
            else {
                replyEmbed = customEmbed("Rolemenu", "Couldn't find a rolemenu with that title!", 'ERROR')
            }
            await interaction.reply({ embeds: [replyEmbed] });
            
        }
        else if (interaction.options.getSubcommand() === 'edit') {
            let title = interaction.options.getString('title');

            
        }

    },
};