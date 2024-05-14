const { bot, mode, commands, PREFIX } = require("../lib");
const { OWNER_NAME, BOT_NAME } = require("../config");
const { hostname } = require("os");

bot(
  {
    pattern: "menu ?(.*)",
    fromMe: true,
    desc: "Show All Commands",
    dontAddCommandList: true,
    type: "user",
  },
  async (message, match) => {
    if (match) {
      for (let i of commands) {
        if (
          i.pattern instanceof RegExp &&
          i.pattern.test(`${PREFIX}` + match)
        ) {
          const cmdName = i.pattern.toString().split(/\W+/)[1];
          message.reply(`\`\`\`bot: ${PREFIX}${cmdName.trim()}
Description: ${i.desc}\`\`\``);
        }
      }
    } else {
      let { prefix } = message;
      let [date, time] = new Date()
        .toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        .split(",");
      let menu = `╭━━━━━ᆫ ${BOT_NAME} ᄀ━━━
┃ ⎆  *OWNER*:  ${OWNER_NAME}
┃ ⎆  *PREFIX*: ${PREFIX}
┃ ⎆  *HOST NAME*: ${hostname().split("-")[0]}
┃ ⎆  *DATE*: ${date}
┃ ⎆  *TIME*: ${time}
┃ ⎆  *COMMANDS*: ${commands.length} 
╰━━━━━━━━━━━━━━━\n`;
      let cmnd = [];
      let cmd;
      let category = [];
      commands.map((bot, num) => {
        if (bot.pattern instanceof RegExp) {
          cmd = bot.pattern.toString().split(/\W+/)[1];
        }

        if (!bot.dontAddCommandList && cmd !== undefined) {
          let type = bot.type ? bot.type.toLowerCase() : "misc";

          cmnd.push({ cmd, type });

          if (!category.includes(type)) category.push(type);
        }
      });
      cmnd.sort();
      category.sort().forEach((cmmd) => {
        menu += `\n\t⦿---- *${cmmd.toUpperCase()}* ----⦿\n`;
        let comad = cmnd.filter(({ type }) => type == cmmd);
        comad.forEach(({ cmd }) => {
          menu += `\n⛥  _${cmd.trim()}_ `;
        });
        menu += `\n`;
      });

      menu += `\n`;
      menu += `_🔖Send ${PREFIX}menu <command name> to get detailed information of a specific command._\n*📍Eg:* _${PREFIX}menu plugin_`;
      return await message.sendMessage(message.jid, menu);
    }
  }
);
