const { EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');

// Initialize dotenv
dotenv.config();

module.exports = function customEmbed(title, description=null, color=process.env.EMBED_BASE_COLOR, url=undefined, author=undefined) {

    const Embed = new EmbedBuilder()
	.setColor(color)
	.setTitle(title)
	.setDescription(description)
	.setTimestamp()
	.setFooter({ text: `${process.env.EMBED_FOOTER_TEXT}` });

	if (url) Embed.setURL(url);
	if (author)	Embed.setAuthor(author);
	if (color === 'ERROR') Embed.setColor(process.env.EMBED_ERROR_COLOR);
	
    return Embed;
};