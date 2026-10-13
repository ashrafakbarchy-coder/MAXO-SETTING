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

// GIF লিঙ্ক
const SPECIFIC_GIF = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZmFhOXk0NHFzdnA3anUzOXcycmVqN3k0eDE0MmRjYjBwZG56enF4NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/8oRH6NS8anmyoNf0qi/giphy.gif';

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

// Helper function to run the nuke loop
async function startNuke(channel) {
  if (isNuking) {
    return 'Nuke process standardly running already!';
  }

  isNuking = true;
  await channel.send('💣 Nuke Activated!');

  // আনলিমিটেড স্প্যাম লুপ
  while (isNuking) {
    try {
      await channel.send(`**NUROX IS THE FATHER**\n${SPECIFIC_GIF}`);
    } catch (err) {
      console.error('Error sending message:', err);
    }

    // ঠিক ২ সেকেন্ড পরপর পাঠাবে
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Helper function to stop the nuke loop
function stopNuke() {
  if (isNuking) {
    isNuking = false;
    return '🛑 Nuke Process Terminated!';
  } else {
    return 'No active nuke loop is running.';
  }
}

// 1. Normal Message Handler (Server-er jnno)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // শুধু আপনি পাঠালেই কাজ করবে
  if (message.author.id !== OWNER_ID) return;

  // NUKE Command
  if (message.content.toLowerCase() === 'nuke') {
    const resMsg = await startNuke(message.channel);
    await message.reply(resMsg);
  }

  // STOP Command
  if (message.content.toLowerCase() === 'stop') {
    const resMsg = stopNuke();
    await message.reply(resMsg);
  }
});

// 2. Slash Command Handler (Group DM / User Install-er jnno)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({ content: '❌ You are not allowed to use this command!', ephemeral: true });
  }

  const { commandName } = interaction;

  if (commandName === 'nuke') {
    if (isNuking) {
      return interaction.reply({ content: 'Nuke process standardly running already!', ephemeral: true });
    }
    await interaction.reply({ content: '💣 Nuke Activated!' });
    
    while (isNuking) {
      try {
        await interaction.channel.send(`**NUROX IS THE FATHER**\n${SPECIFIC_GIF}`);
      } catch (err) {
        console.error('Error sending message:', err);
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
