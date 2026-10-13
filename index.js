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
const SPECIFIC_GIF = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjE3NExFM0xFZmFhZXUzOXcycmVqN3k0eDE0M2M0MmR1M1NlaF4NCZ1cD12MV9naWZzX3NlYXJjaCZjdD1n/8oRH6NS8anmyoNf0qi/giphy.gif';

// Slash Commands definition
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

    // Register Slash Commands globally for User Install
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

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // Only owner can use commands
    if (interaction.user.id !== OWNER_ID) {
        return interaction.reply({ content: '❌ You are not allowed to use this command!', ephemeral: true });
    }

    const { commandName } = interaction;

    if (commandName === 'nuke') {
        if (isNuking) {
            return interaction.reply({ content: '⚠️ Nuke Process is already running!', ephemeral: true });
        }

        isNuking = true;
        await interaction.reply({ content: '🚀 Nuke Process Started!' });

        while (isNuking) {
            try {
                await interaction.channel.send(`NUROX IS THE FATHER\n<${SPECIFIC_GIF}>`);
                await new Promise(resolve => setTimeout(resolve, 600));
            } catch (error) {
                console.error('Error sending message:', error);
                break;
            }
        }
    }

    if (commandName === 'stop') {
        if (!isNuking) {
            return interaction.reply({ content: '🛑 No Nuke Process is currently running.', ephemeral: true });
        }

        isNuking = false;
        await interaction.reply({ content: '🛑 Nuke Process Terminated!' });
    }
});

client.login(BOT_TOKEN);
