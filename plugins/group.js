const { bot,mode } = require("../lib/");
 bot(
  {
    pattern: "promote ?(.*)",
    fromMe: mode,
    desc: "promote to admin",
    type: "group",
  },
  async (message, match) => {
    if (!message.isGroup)
      return await message.reply("_This command is for groups_");

    match = match || message.reply_message.sender;
    if (!match) return await message.reply("_Mention user to promote_");

    const isadmin = await message.isAdmin(message.user);

    if (!isadmin) return await message.reply("_I'm not admin_");
    const jid = parsedJid(match);

    await message.promote(jid);

    return await message.send(`_@${jid[0].split("@")[0]} promoted as admin_`, {
      mentions: [jid],
    });
  }
);
bot(
  {
    pattern: "demote ?(.*)",
    fromMe: mode,
    desc: "demote from admin",
    type: "group",
  },
  async (message, match) => {
    if (!message.isGroup)
      return await message.reply("_This command is for groups_");

    match = match || message.reply_message.sender;
    if (!match) return await message.reply("_Mention user to demote_");

    const isadmin = await message.isAdmin(message.user);

    if (!isadmin) return await message.reply("_I'm not admin_");
    const jid = parsedJid(match);

    await message.demote(jid);

    return await message.send(
      `_@${jid[0].split("@")[0]} demoted from admin_`,
      {
        mentions: [jid],
      }
    );
  }
);