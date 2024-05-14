const config = require("../config");
const { bot, mode, toAudio,webp2mp4 } = require("../lib/");
bot(
  {
    pattern: "sticker",
    fromMe: mode,
    desc: "Converts Photo/video/text to sticker",
    type: "converter",
  },
  async (message, match, client) => {
    if (
      !(
        message.reply_message.video ||
        message.reply_message.image ||
        message.reply_message.text
      )
    )
      return await message.reply("Reply to photo/video/text");

    let buff = await message.quoted.download("buffer");
    message.sendMessage(
      message.jid,
      buff,
      { packname: config.PACKNAME, author: config.AUTHOR },
      "sticker"
    );
  }
);
 bot(
  {
    pattern: "take ?(.*)",
    fromMe: mode,
    desc: "Change sticker pack name",
    type: "converter",
  },
  async (message, match, client) => {
    if (!message.reply_message.sticker)
      return await message.reply("_Reply to a sticker_");
    const packname = match.split(";")[0] || config.PACKNAME;
    const author = match.split(";")[1] || config.AUTHOR;
    let buff = await message.quoted.download("buffer");
    message.sendMessage(message.jid, buff, { packname, author }, "sticker");
  }
);