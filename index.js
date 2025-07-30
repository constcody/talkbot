// Removed dotenv import as you're hardcoding TOKEN and CLIENT_ID
import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder, AttachmentBuilder } from 'discord.js'; // Import AttachmentBuilder

// Hardcoded TOKEN and CLIENT_ID as requested
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// Define your commands
const commands = [
  new SlashCommandBuilder()
    .setName('nepal')
    .setDescription('Resends your message through the bot')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message you want the bot to say')
        .setRequired(true)
    ),
  // New /image command definition
  new SlashCommandBuilder()
    .setName('image')
    .setDescription('Sends an image file through the bot.')
    .addAttachmentOption(option =>
      option.setName('file')
        .setDescription('The image file to send.')
        .setRequired(true)
    )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

// Command registration logic
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    // Register commands globally if GUILD_ID is not defined, otherwise guild-specific
    if (GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
      );
      console.log('Successfully reloaded application (/) commands for guild.');
    } else {
      await rest.put(
        Routes.applicationCommands(CLIENT_ID), // For global commands
        { body: commands }
      );
      console.log('Successfully reloaded application (/) commands globally.');
    }

  } catch (error) {
    console.error(error);
  }
})();


// Main bot logic
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'nepal') {
    const message = interaction.options.getString('message');
    const username = interaction.user.username;

    await interaction.reply({ content: `Sending your message...`, ephemeral: true });
    await interaction.channel.send(`${username} said: ${message}`);
  } else if (interaction.commandName === 'image') { // New /image command handler
    const attachment = interaction.options.getAttachment('file');

    // Check if the attachment is actually an image (optional but good practice)
    if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
      return interaction.reply({ content: 'Please upload an image file!', ephemeral: true });
    }

    await interaction.reply({ content: `Sending ${attachment.name}...`, ephemeral: true });

    try {
      // Send the attachment URL directly
      await interaction.channel.send({ files: [attachment.url] });
    } catch (error) {
      console.error("Error sending image:", error);
      await interaction.channel.send({ content: `Failed to send image: ${error.message}`, ephemeral: true });
    }
  }
});

client.login(TOKEN);
