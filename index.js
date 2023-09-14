require('dotenv').config();

const {REST, RESTEvents} = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const fs = require('fs');
const path = require('path');

// intents are what the bot SHOULD be allowed to do in a server
const client = new Client({ 
  intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      ]
});

// Load all commands
const commands = [];                // stores list of all the commands in our folder
client.commands = new Collection(); // a collection of all the command names and command functions

const commandsPath = path.join(__dirname, 'commands');                                // holds the path to the commands
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for(const file of commandFiles)        // for each file we load the command into a temporary "command" variable, then we store the name and command inside our client.command object, and lastly load the command as a JSON into the array
{
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON()); 

}

// discord events
// ready function called when bot is first online

client.on("ready", () => {
  // get all ids of the servers
  const guild_ids = client.guilds.cache.map(guild => guild.id);

  const rest = new REST({version: '9'}).setToken(process.env.TOKEN);
  for (const guildId of guild_ids)
  {
    rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
      {body: commands})
   .then(() => console.log('Successfully updated commands for guild ' + guildId))
   .catch(console.error);
  }
})

// filters through registered interactions and makes sure it exists

client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand())
    return;

  const command = client.commands.get(interaction.commandName);

  if (!command)
    return;
  
    try 
    {
      await command.execute(interaction);
    }
    catch(error)
    {
      console.error(error);
      await interaction.reply({content: "There was an error executing this command"});
    }
});

client.login(process.env.TOKEN);