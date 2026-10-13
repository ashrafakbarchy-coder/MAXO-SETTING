const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot is Alive!'));
app.listen(3000, () => console.log('Server is active on port 3000'));

const { Client, GatewayIntentBits } = require('discord.js');

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

// GIF লিংক
const SPECIFIC_GIF = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjE3NExFM0xFZmFhZXUzOXcycmVqN3k0eDE0M2M0MmR1M1NlaF4NCZ1cD12MV9naWZzX3NlYXJjaCZjdD1n/8oRH6NS8anmyoNf0qi/giphy.gif';

client.on('ready', () => {
    console.log(`Bot logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // শুধু নির্দিষ্ট ওনারের কমান্ড শুনবে
    if (message.author.id !== OWNER_ID) return;

    // NUKE Command
    if (message.content.toLowerCase() === 'nuke') {
        if (isNuking) {
            return message.channel.send('⚠️ Nuke Process is already running!');
        }

        isNuking = true;
        message.channel.send('🚀 Nuke Process Started!');

        while (isNuking) {
            try {
                // < > দিয়ে লিংক হাইড করা হয়েছে যেন টেক্সটের সাথে বড় লিংক না দেখায়
                await message.channel.send(`NUROX IS THE FATHER\n<${SPECIFIC_GIF}>`);
                await new Promise(resolve => setTimeout(resolve, 500)); // Spam speed limit
            } catch (error) {
                console.error('Error sending message:', error);
                break;
            }
        }
    }

    // STOP Command
    if (message.content.toLowerCase() === 'stop') {
        if (!isNuking) {
            return message.channel.send('🛑 No Nuke Process is currently running.');
        }

        isNuking = false;
        message.channel.send('🛑 Nuke Process Terminated!');
    }
});

client.login(BOT_TOKEN);
