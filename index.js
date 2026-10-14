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
const SPECIFIC_GIF = 'https://media.giphy.com/media/8oRH6NS8anmyoNf0qi/giphy.gif';

// Register Slash Commands
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

  client.user.setPresence({
    activities: [{
      name: 'Custom Status',
      type: 4, 
      state: '👑 LISTENING TO NUROX' 
    }],
    status: 'online'
  });

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

// 1. Normal Message Handler
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  if (content === 'greet') {
    await message.channel.send('> **YOO EVERYONE SUP?**');
    return;
  }

  if (content === 'nuke' || content === 'stop') {
    if (message.author.id !== OWNER_ID) {
      return message.reply('❌ You are not NUROX to use this command!');
    }
  }

  if (message.author.id === OWNER_ID) {
    if (content === 'nuke') {
      if (isNuking) {
        return message.reply('Nuke process standardly running already!');
      }
      isNuking = true;
      await message.reply('💣 Nuke Activated!');
      
      while (isNuking) {
        try {
          await message.channel.send(`> # **<a:crown_anm:1559736674941014057>NUROX IS THE FATHER**\n${SPECIFIC_GIF}`);
        } catch (err) {
          console.error('Error sending message:', err);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      return;
    }

    if (content === 'stop') {
      if (isNuking) {
        isNuking = false;
        await message.reply('🛑 Nuke Process Terminated!');
      } else {
        await message.reply('No active nuke loop is running.');
      }
      return;
    }
  }

  // AI Response Section with {} prevention & Pure Bengali reply
  if (message.mentions.has(client.user)) {
    try {
      const promptText = message.content.replace(`<@!${client.user.id}>`, '').replace(`<@${client.user.id}>`, '').trim();
      if (!promptText) return;

      const systemInstruction = "You are MAXO, a friendly Discord bot. Understand whatever language or Banglish the user writes, but you MUST reply exclusively in fluent, natural, and beautiful pure Bengali text (using Bengali alphabet/script). Never use English letters for your response. User says: ";
      const fullPrompt = systemInstruction + promptText;
      const encodedPrompt = encodeURIComponent(fullPrompt);
      
      const response = await fetch(`https://text.pollinations.ai/${encodedPrompt}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      
      let replyText = await response.text();

      // Jodi server theke khali ba {} ase, tahle fallback message dibe
      if (!replyText || replyText.trim() === '{}' || replyText.trim() === '"{}"') {
        replyText = "দুঃখিত, এই মুহূর্তে সার্ভার থেকে কোনো উত্তর পাওয়া যায়নি। একটু পরে আবার চেষ্টা করুন!";
      }

      await message.reply(replyText);
    } catch (error) {
      console.error('AI Error:', error);
      await message.reply('ওপ্স! এআই ব্রেন এখন কাজ করছে না।');
    }
  }
});

// 2. Slash Command Handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'greet') {
    return interaction.reply({ content: '> **YOO EVERYONE SUP?**' });
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
        await interaction.followUp({ content: `> # **<a:crown_anm:1559736674941014057>NUROX IS THE FATHER**\n${SPECIFIC_GIF}` });
      } catch (err) {
        console.error('Error sending followUp:', err);
        try {
          await interaction.channel.send(`> # **<a:crown_anm:1559736674941014057>NUROX IS THE FATHER**\n${SPECIFIC_GIF}`);
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
