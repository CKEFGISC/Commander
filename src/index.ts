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

client.on(Dc.Events.MessageCreate, async (msg) => {
  // if (msg.partial) await msg.fetch(false).then((newMsg) => msg = newMsg, null);

  if (!msg.content.startsWith(process.env.COMMAND_PREFIX)) return;

  let args = msg.content.slice(process.env.COMMAND_PREFIX.length).split(/ /g).filter(arg => arg !== "");

  if ((await Database.get("users") as Array<{ userId: string, name: string }>)
    .findIndex(userData => userData.userId === msg.author.id) === -1) {
    return;
  } 

  let ping, userId, name;
  switch (args[0]) {
    case "create-user":
      ping = args[1];
      userId = ping.match(/^<@(\d+)>$/)?.[1];
      name = args[2];

      if (!userId || !name) {
        msg.reply("Invalid Argument.");
        return;
      }

      Database.appendToArray("users", { userId, name });
      msg.reply(`Created user \`${name}\` for ${ping}.`);
      console.log(`@${msg.author.tag} creates user "${name}"`);
      break;
    case "delete-user":
      name = args[1];

      if (!name) {
        msg.reply("Invalid Argument.");
        return;
      }

      Database.removeFromArrayIf("users", (userData) => userData.name === name);
      msg.reply(`Deleted user \`${name}\`.`);
      console.log(`@${msg.author.tag} deletes user "${name}"`);
      break;
    case "run":
      let cli = {
        username: OS.userInfo().username,
        hostname: OS.hostname(),
        path: process.cwd()
      }
      if (cli.path.startsWith(`/home/${OS.userInfo().username}`))
        cli.path = cli.path.slice(`/home/${OS.userInfo().username}`.length);
      const commandLineInfo = `${cli.username}@${cli.hostname}:${cli.path}$`;

      const systemCommand = args.slice(1).join(" ");
      if (!systemCommand) {
        msg.reply("Invalid Argument.");
        return
      }

      let systemCommandArguments = args.slice(2);
      if (!systemCommandArguments.length) systemCommandArguments = [];

      let repliedMsg = await msg.reply(`\`\`\`ansi\n${commandLineInfo} ${systemCommand}\n\`\`\``);
      let editRepliedMessage = (exitMessage = "") => {
        let newContent = `\`\`\`ansi\n${commandLineInfo} ${systemCommand}\n`
          + history.join("\n") + "\n"
          + `${exitMessage}\n\`\`\``;

        if (newContent.length > 4000)
          repliedMsg.edit("Can't edit message because `length > 4000`.");
        else
          repliedMsg.edit(newContent);
      };

      const child = ChildProcess.spawn(systemCommand, systemCommandArguments, { shell: true });

      let history: Array<string> = [];

      child.stdout.on("data", (data) => {
        history.push(data);
        editRepliedMessage();
      });

      child.stderr.on("data", (data) => {
        history.push(data);
        editRepliedMessage();
      });

      child.on("error", (err) => {
        history.push(`Error: ${err.message}`);
        editRepliedMessage();
      });

      child.on("close", (code) => {
        editRepliedMessage(`Process exited with code ${code}`);
      });
      
      console.log(`@${msg.author.tag} runs ${systemCommand}`);
      break;
  }
});

client.login(process.env.BOT_TOKEN);
