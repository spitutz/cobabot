 const { fromBuffer } = require("file-type");
const { bot,mode,ffmpeg,parseTimeToSeconds } = require("../lib/");
bot(
  {
    pattern: "trim ?(.*)",
    fromMe: mode,
    desc: "Trim the video or audio",
    type: "user",
  },
  async (message, match, client) => {
    if (
      !message.reply_message ||
      (!message.reply_message.video && !message.reply_message.audio)
    ) {
      return await message.send("Reply to a media file");
    }
    if (!match)
      return await message.send(
        "Give the start and end time in this format: mm:ss;mm:ss"
      );

    const [start, end] = match.split(";");
    if (!start || !end)
      return await message.send(
        "Give the start and end time in this format: mm:ss;mm:ss"
      );
    const buffer = await message.quoted.download("buffer");
    const startSeconds = parseTimeToSeconds(start);
    const endSeconds = parseTimeToSeconds(end);
    const duration = endSeconds - startSeconds;
    const ext = (await fromBuffer(buffer)).ext;
    const args = ["-ss", `${startSeconds}`, "-t", `${duration}`, "-c", "copy"];
    const trimmedBuffer = await ffmpeg(buffer, args, ext, ext);
    message.sendFile(trimmedBuffer);
  }
);