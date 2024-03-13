import Dc from "discord.js";
import Database from "./modules/Database";
import ChildProcess from "node:child_process";
import OS from "node:os";

import DotEnv from "dotenv";
DotEnv.config();

const client = new Dc.Client({
  intents: [
    Dc.GatewayIntentBits.Guilds,
    Dc.GatewayIntentBits.GuildMessages,
    Dc.GatewayIntentBits.GuildMembers,
    Dc.GatewayIntentBits.GuildIntegrations,
    Dc.GatewayIntentBits.GuildMessageReactions,
    Dc.GatewayIntentBits.GuildEmojisAndStickers,
    Dc.GatewayIntentBits.MessageContent,
    Dc.GatewayIntentBits.GuildVoiceStates,
    Dc.GatewayIntentBits.GuildMessageTyping,
    Dc.GatewayIntentBits.GuildWebhooks,
    Dc.GatewayIntentBits.GuildPresences,
    Dc.GatewayIntentBits.GuildModeration,
    Dc.GatewayIntentBits.DirectMessages,
    Dc.GatewayIntentBits.DirectMessageReactions,
    Dc.GatewayIntentBits.DirectMessageTyping
  ],
  partials: [
    Dc.Partials.Message,
    Dc.Partials.Channel,
    Dc.Partials.Reaction,
    Dc.Partials.ThreadMember,
    Dc.Partials.GuildMember,
    Dc.Partials.User
  ]
});

client.on(Dc.Events.ClientReady, async () => {
  console.log(`Client @${client.user.tag} is ready`)
});

async function run(msg: Dc.Message, systemCommand: string, systemCommandArguments: Array<string>) {
  if (!systemCommand) {
    msg.reply("Invalid arguments.");
    return;
  }
  
  let cli = {
    username: OS.userInfo().username,
    hostname: OS.hostname(),
    path: process.cwd()
  }
  if (cli.path.startsWith(`/home/${cli.username}`))
    cli.path = "~" + cli.path.slice(`/home/${cli.username}`.length);
  const commandLineInfo = `${cli.username}@${cli.hostname}:${cli.path}$`;
  
  let outputLines = new Array<string>();
  outputLines.push([ commandLineInfo, systemCommand, ...systemCommandArguments ].join(" "));

  let repliedMsg = await msg.reply(
    "```\n" + outputLines.join("\n") + "\n```"
  );
  
  let editRepliedMessage = (newLine: string) => {
    outputLines.push(newLine);

    let content = outputLines.join("\n");
    if (content.length > 1992) {
      outputLines = [ newLine ];
      msg.channel.send("```sh\n" + newLine + "\n```");
      return;
    }

    repliedMsg.edit("```sh\n" + content + "\n```");
  };

  const child = ChildProcess.spawn(systemCommand, systemCommandArguments, { shell: true });

  child.stdout.on("data", (data) => {
    editRepliedMessage(data);
  });

  child.stderr.on("data", (data) => {
    editRepliedMessage(data);
  });

  child.on("error", (err) => {
    editRepliedMessage(`Error: ${err.message}`);
  });

  child.on("close", (code) => {
    editRepliedMessage(`\nProcess exited with code ${code}`);
  });
  
  console.log(`@${msg.author.tag} runs ${systemCommand} ${systemCommandArguments.join(" ")}`);
}

type UserInfo = {
  userId: Dc.Snowflake;
  name: string;
};

type CustomCommand = {
  name: string;
  command: string;
  args: Array<string>;
};

client.on(Dc.Events.MessageCreate, async (msg) => {
  // if (msg.partial) await msg.fetch(false).then((newMsg) => msg = newMsg, null);

  if (!msg.content.startsWith(process.env.COMMAND_PREFIX)) return;

  let args = msg.content.slice(process.env.COMMAND_PREFIX.length).split(/ /g).filter(arg => arg !== "");

  if ((await Database.get("users") as Array<{ userId: string, name: string }>)
    .findIndex(userData => userData.userId === msg.author.id) === -1) {
    return;
  } 

  let ping: Dc.UserMention, userId: Dc.Snowflake, name: string;
  switch (args[0]) {
    case "create-user":
      ping = args[1] as Dc.UserMention;
      userId = ping.match(/^<@(\d+)>$/)?.[1] as Dc.Snowflake;
      name = args[2];

      if (!userId || !name) {
        msg.reply("Invalid arguments.");
        return;
      }

      Database.appendToArray("users", { userId, name });
      msg.reply(`Created user \`${name}\` for ${ping}.`);
      console.log(`@${msg.author.tag} creates user "${name}"`);
      break;

    case "delete-user":
      name = args[1];

      if (!name) {
        msg.reply("Invalid arguments.");
        return;
      }

      Database.removeFromArrayIf<UserInfo>("users", (userData) => userData.name === name);
      msg.reply(`Deleted user \`${name}\`.`);
      console.log(`@${msg.author.tag} deletes user "${name}"`);
      break;

    case "run":
      await run(msg, args[1], args.slice(2));
      break;

    case "define":
      let newCustomCommand: CustomCommand = {
        name: args[1],
        command: args[2],
        args: args.slice(3)
      };

      if (!newCustomCommand.name || !newCustomCommand.command) {
        msg.reply("Invalid arguments.");
        return;
      }

      if ([ "create-user", "delete-user", "run", "define", "undefine" ].includes(newCustomCommand.name) ||
        (await Database.get("customCommands") as Array<CustomCommand>)
          .findIndex(cc => cc.name === newCustomCommand.name) !== -1) {
        await msg.reply("Command already exist!");
        return;
      }

      Database.appendToArray("customCommands", newCustomCommand);
      msg.reply(`Created command \`${newCustomCommand.name}\``);
      console.log(`@${msg.author.tag} creates command "${newCustomCommand.name}"`);
      break;

    case "undefine":
      let commandName = args[1];

      if (!commandName) {
        msg.reply("Invalid arguments.");
        return;
      }

      Database.removeFromArrayIf<CustomCommand>("customCommands", (cc) => cc.name === commandName);
      msg.reply(`Removed command \`${commandName}\``);
      console.log(`@${msg.author.tag} deletes command "${commandName}"`);
      break;

    default:
      let customCommands = await Database.get("customCommands") as Array<CustomCommand>;
      
      let cmd = customCommands.find(cc => cc.name === args[0]);
      if (!cmd) return;

      run(msg, cmd.command, cmd.args);
      break;
  }
});

client.login(process.env.BOT_TOKEN);
