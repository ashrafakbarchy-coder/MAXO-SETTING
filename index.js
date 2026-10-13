const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot is Alive!'));
app.listen(3000, () => console.log('Server is active on port 3000'));
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let isNuking = false;

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = process.env.OWNER_ID;

// GIF link
const SPECIFIC_GIF = '[.](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZmFhOXk0NHFzdnA3anUzOXcycmVqN3k0eDE0MmRjYjBwZG56enF4NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/8oRH6NS8anmyoNf0qi/giphy.gif)';

// Register Slash Commands for User Install / Guilds
const commands = [
  new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Start nuke process')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop nuke process')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  new SlashCommandBuilder()
    .setName('greet')
    .setDescription('Greet everyone')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
].map(cmd => cmd.toJSON());

client.on('ready', async () => {
  console.log(`Bot logged in as ${client.user.tag}!`);

  const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('Slash commands registered successfully!');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
});

// 1. Normal Message Handler (Server-er jnno)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.toLowerCase() === 'greet') {
    await message.channel.send('**YOO EVERYONE**');
  }

  if (message.author.id !== OWNER_ID) return;

  if (message.content.toLowerCase() === 'nuke') {
    if (isNuking) {
      return message.reply('Nuke process standardly running already!');
    }
    isNuking = true;
    await message.reply('💣 Nuke Activated!');
    
    while (isNuking) {
      try {
        await message.channel.send(`**> NUROX IS THE FATHER**\n${SPECIFIC_GIF}`);
      } catch (err) {
        console.error('Error sending message:', err);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (message.content.toLowerCase() === 'stop') {
    if (isNuking) {
      isNuking = false;
      await message.reply('🛑 Nuke Process Terminated!');
    } else {
      await message.reply('No active nuke loop is running.');
    }
  }
});

// 2. Slash Command Handler (Group DM / User Install-er jnno)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // Greet command shobar jonno ekbar-e reply korbe, kono spam hobe na
  if (commandName === 'greet') {
    return interaction.reply({ content: '> **YOO EVERYONE sup??**' });
  }

  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({ content: '❌ You are not NUROX to use this command!', ephemeral: true });
  }

  if (commandName === 'nuke') {
    if (isNuking) {
      return interaction.reply({ content: 'Nuke process standardly running already!', ephemeral: true });
    }

    isNuking = true;
    await interaction.reply({ content: '💣 Nuke Activated!' });
    
    while (isNuking) {
      try {
        await interaction.followUp({ content: `**NUROX IS THE FATHER**\n${SPECIFIC_GIF}` });
      } catch (err) {
        console.error('Error sending followUp:', err);
        try {
          await interaction.channel.send(`**NUROX IS THE FATHER**\n${SPECIFIC_GIF}`);
        } catch (e) {
          console.error('Fallback channel send error:', e);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (commandName === 'stop') {
    if (isNuking) {
      isNuking = false;
      await interaction.reply({ content: '🛑 Nuke Process Terminated!' });
    } else {
      await interaction.reply({ content: 'No active nuke loop is running.', ephemeral: true });
    }
  }
});

client.login(BOT_TOKEN);
