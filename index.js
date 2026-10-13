const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let isNuking = false;

// ⚠️ এখানে আপনার নিজের Discord User ID দিন
const OWNER_ID = '1120017161847582770';

// ⚠️ এখানে আপনার Discord Developer Portal থেকে নেওয়া Bot Token দিন
const BOT_TOKEN = 'MTMwMzM2OTgzMjM2ODA0NjEwMA.G9dLVr.aTfJLwIfnqBwPi9MqAxskORVz-tuvEsPAfFbvA';

// GIF লিঙ্ক
const SPECIFIC_GIF = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZmFhOXk0NHFzdnA3anUzOXcycmVqN3k0eDE0MmRjYjBwZG56enF4NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/8oRH6NS8anmyoNf0qi/giphy.gif';

client.on('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // শুধু আপনি পাঠালেই কাজ করবে
  if (message.author.id !== OWNER_ID) return;

  // NUKE Command
  if (message.content.toLowerCase() === 'nuke') {
    if (isNuking) {
      return message.reply('Nuke process standardly running already!');
    }

    isNuking = true;
    await message.reply('💣 Nuke Activated!');

    // আনলিমিটেড স্প্যাম লুপ
    while (isNuking) {
      try {
        await message.channel.send(`**NUROX IS THE FATHER**\n${SPECIFIC_GIF}`);
      } catch (err) {
        console.error('Error sending message:', err);
      }

      // ঠিক ২ সেকেন্ড পরপর পাঠাবে
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // STOP Command
  if (message.content.toLowerCase() === 'stop') {
    if (isNuking) {
      isNuking = false;
      await message.reply('🛑 Nuke Process Terminated!');
    } else {
      await message.reply('No active nuke loop is running.');
    }
  }
});

client.login(BOT_TOKEN);
