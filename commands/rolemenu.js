const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
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
            const res = await dbClient.query("SELECT * FROM rolemenus WHERE guild_id = $1 AND title = $2", [interaction.guildId, title]);
            if (res.rowCount === 0) {
                let description = interaction.options.getString('description');
                let embed = customEmbed("Rolemenu Create", `Title: \`${title}\`\n Description: \`${description}\``);
                embed.addFields({ name: "Roles", value: "Please choose available roles to add to the rolemenu.\nMake sure all roles used are below the Pegasus role!" });
                let roles = interaction.guild.roles.cache;
                let botRole = interaction.guild.roles.botRoleFor(interaction.client.user);
                let availableRoles = roles.filter(role => interaction.guild.roles.comparePositions(botRole, role) > 0 && role.name !==  '@everyone');
                // We assume no server has more than 25 selectable roles bc wtf
                if (availableRoles.size <= 25) {
                    let formatted = availableRoles.map(role => ({ 
                        label: `${role.name}`, 
                        description: role.managed ? "Watch out, this role is managed by an application." : "Select to add.", 
                        value: `${role.id}` 
                    }));
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`rm${title}`)
                                .setPlaceholder('Please choose the roles for the menu')
                                .setMinValues(1)
                                .setMaxValues(availableRoles.size > 10 ? 10 : availableRoles.size)
                                .addOptions(formatted)
                        );
                    await interaction.reply({ embeds: [embed], components: [row] });

                    // Collecting the selectmenu


                }
                else {
                    embed = customEmbed("Rolemenu Create", "Too many available roles, contact bot owner.", "ERROR");
                    await interaction.reply({ embeds: [embed] });
                }
            }
            else {
                let embed = customEmbed("Rolemenu Create", `There already exists a rolemenu with title \`${title}\``, "ERROR");
                await interaction.reply({ embeds: [embed] });
            }


        }
        else if (interaction.options.getSubcommand() === 'delete') {
            let title = interaction.options.getString('title');
            const res = await dbClient.query("SELECT * FROM rolemenus WHERE guild_id = $1 AND title = $2", [interaction.guildId, title]);
            let replyEmbed;

            if (res.rowCount > 0) {
                let msg_id = res.rows[0].msg_id;
                // Delete message if it was still there
                if (msg_id !== null) {
                    let ch_id = res.rows[0].channel_id;
                    let ch = await interaction.guild.channels.fetch(`${ch_id}`);
                    await ch.messages.delete(`${msg_id}`); // Can error if messsage has been manually deleted.
                }

                await dbClient.query("DELETE FROM rolemenus WHERE guild_id = $1 AND title = $2", [interaction.guildId, res.rows[0].title]);

                replyEmbed = customEmbed("Rolemenu", `Successfully deleted rolemenu named \`${res.rows[0].title}\`.`);
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