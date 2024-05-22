const { bot,mode,isAdmin } = require("../lib/");
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
bot(
  {
    pattern: "mute ?(.*)",
    fromMe: true,
    desc: "mute group",
    type: "group",
  },
  async (message, match) => {
    if (!message.isGroup)
      return await message.reply("_This command is for groups_");
    if (!isAdmin(message.jid, message.user, message.client))
      return await message.reply("_I'm not admin_");
    await message.reply("_Muting_");
    if (!match || isNaN(match)) {
      await message.mute(message.jid);
      await message.send('*Group Muted.*');
      return;
    }
    await message.mute(message.jid);
    await message.send('_Group muted for ' + match + ' mins_');
    await sleep(1000 * 60 * match);
    await message.unmute(message.jid);
    await message.send('*Group unmuted.*');   
  }
);
bot(
  {
    pattern: "unmute ?(.*)",
    fromMe: true,
    desc: "unmute group",
    type: "group",
  },
  async (message, match) => {
    if (!message.isGroup)
      return await message.reply("_This command is for groups_");
    if (!isAdmin(message.jid, message.user, message.client))
      return await message.reply("_I'm not admin_");
    await message.reply("_Unmuting_");
    if (!match || isNaN(match)) {
      await message.unmute(message.jid);
      await message.send('*Group Closed.*');
      return;
    }
    await message.unmute(message.jid);
    await message.send('_Group unmuted for ' + match + ' mins_');
    await sleep(1000 * 60 * match);
    await message.mute(message.jid);
    await message.send('*Group closed.*');   
  }
);