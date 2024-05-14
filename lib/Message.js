const {
  getContentType,
  jidNormalizedUser,
  generateWAMessageFromContent,
  generateWAMessage,
  generateForwardMessageContent,
  downloadMediaMessage,
} = require("@adiwajshing/baileys");
const { decodeJid } = require("./functions")
const Base = require("./Base");
const ReplyMessage = require("./ReplyMessage");
const config = require("../config");
const fileType = require("file-type");
const { getFile } = require("./utils");
const { serialize } = require("./serialize");
const {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid,
  writeExifWebp,
} = require("../lib/sticker");

const { createInteractiveMessage } = require("./functions");
class Message extends Base {
  constructor(client, data) {
    super(client);
    if (data) {
      this.patch(data);
    }
  }

  patch(data) {
    this.id = data.key?.id;
    this.jid = this.chat = data.key?.remoteJid;
    this.fromMe = data.key?.fromMe;
     this.user = decodeJid(this.client.user.id);
    this.sender = jidNormalizedUser(
      (this.fromMe && this.client.user.id) ||
        this.participant ||
        data.key.participant ||
        this.chat ||
        ""
    );
    this.pushName = data.pushName || this.client.user.name || "";
    this.message = this.text =
      data.message?.extendedTextMessage?.text ||
      data.message?.imageMessage?.caption ||
      data.message?.videoMessage?.caption ||
      data.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      data.message?.buttonsResponseMessage?.selectedButtonId ||
      data.message?.templateButtonReplyMessage?.selectedId ||
      data.message?.editedMessage?.message?.protocolMessage?.editedMessage
        ?.conversation ||
      data.message?.conversation;
    this.data = data;
    this.type = getContentType(data.message);
    this.msg = data.message[this.type];
    this.reply_message = this.quoted = this.msg?.contextInfo?.quotedMessage
      ? new ReplyMessage(this.client, {
          chat: this.chat,
          msg: this.msg,
          ...this.msg.contextInfo,
        })
      : false;
    this.mention = this.msg?.contextInfo?.mentionedJid || false;
    this.isGroup = this.chat.endsWith("@g.us");
    this.isPm = this.chat.endsWith("@s.whatsapp.net");
    this.isBot = this.id.startsWith("BAE5") && this.id.length === 16;
    const sudo = config.SUDO.split(",") || config.SUDO + ",0";
    this.isSudo = [jidNormalizedUser(this.client.user.id), ...sudo]
      .map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
      .includes(this.sender);
    const contextInfo = data.message.extendedTextMessage?.contextInfo;
    this.mention = contextInfo?.mentionedJid || false;
/*
      if (data.quoted) {
      if (data.message.buttonsResponseMessage) return;
      this.reply_message = new ReplyMessage(this.client, contextInfo, data);
      const quotedMessage = data.quoted.message.extendedTextMessage;
      this.reply_message.type = data.quoted.type || "extendedTextMessage";
      this.reply_message.mtype = data.quoted.mtype;
      this.reply_message.mimetype =
        quotedMessage?.text?.mimetype || "text/plain";
      this.reply_message.key = data.quoted.key;
      this.reply_message.message = data.quoted.message;
      this.reply_message.mention =
        quotedMessage?.contextInfo?.mentionedJid || false;
    } else {
      this.reply_message = false;
    }
*/  
      
    return super.patch(data);
  }

  async reply(text, options) {
    const message = await this.client.sendMessage(
      this.jid,
      { text },
      { quoted: this.data, ...options }
    );
    return new Message(this.client, message);
  }

 async send(
    content,
    opt = { packname: "mask ser", author: "Mask ser" },
    type = "text"
  ) {
    switch (type.toLowerCase()) {
      case "text":
        {
          return this.client.sendMessage(
            this.jid,
            {
              text: content,
              ...opt,
            },
            { ...opt }
          );
        }
        break;
      case "image":
        {
          if (Buffer.isBuffer(content)) {
            return this.client.sendMessage(
              this.jid,
              { image: content, ...opt },
              { ...opt }
            );
          } else if (isUrl(content)) {
            return this.client.sendMessage(
              this.jid,
              { image: { url: content }, ...opt },
              { ...opt }
            );
          }
        }
        break;
      case "video": {
        if (Buffer.isBuffer(content)) {
          return this.client.sendMessage(
            jid,
            { video: content, ...opt },
            { ...opt }
          );
        } else if (isUrl(content)) {
          return this.client.sendMessage(
            this.jid,
            { video: { url: content }, ...opt },
            { ...opt }
          );
        }
      }
      case "audio":
        {
          if (Buffer.isBuffer(content)) {
            return this.client.sendMessage(
              this.jid,
              { audio: content, ...opt },
              { ...opt }
            );
          } else if (isUrl(content)) {
            return this.client.sendMessage(
              this.jid,
              { audio: { url: content }, ...opt },
              { ...opt }
            );
          }
        }
        break;
      case "template":
        let optional = await generateWAMessage(jid, content, opt);
        let message = {
          viewOnceMessage: {
            message: {
              ...optional.message,
            },
          },
        };
        await this.client.relayMessage(this.jid, message, {
          messageId: optional.key.id,
        });

        break;
      case "interactive":
        const genMessage = createInteractiveMessage(content);
        await this.client.relayMessage(this.jid, genMessage.message, {
          messageId: genMessage.key.id,
        });

        break;
      case "sticker":
        {
          let { data, mime } = await getFile(content);
          if (mime == "image/webp") {
            let buff = await writeExifWebp(data, opt);
            await this.client.sendMessage(
              this.jid,
              { sticker: { url: buff }, ...opt },
              opt
            );
          } else {
            mime = await mime.split("/")[0];

            if (mime === "video") {
              await this.client.sendVideoAsSticker(this.jid, content, opt);
            } else if (mime === "image") {
              await this.client.sendImageAsSticker(this.jid, content, opt);
            }
          }
        }
        break;
    }
  }
  async sendFile(content, options = {}) {
    const { data } = await getFile(content);
    const type = await fileType.fromBuffer(data);
    return this.client.sendMessage(
      this.jid,
      { [type.mime.split("/")[0]]: data },
      options
    );
  }

  async delete() {
    return await this.client.sendMessage(this.jid, {
      delete: { ...this.data.key, participant: this.sender },
    });
  }

  async edit(conversation) {
    return await this.client.relayMessage(
      this.jid,
      {
        protocolMessage: {
          key: this.data.key,
          type: 14,
          editedMessage: { conversation },
        },
      },
      {}
    );
  }
  async sendFromUrl(url, options = {}) {
    let buff = await getBuffer(url);
    let mime = await fileType.fromBuffer(buff);
    let type = mime.mime.split("/")[0];
    if (type === "audio") {
      options.mimetype = "audio/mpeg";
    }
    if (type === "application") type = "document";
    return this.client.sendMessage(
      this.jid,
      { [type]: buff, ...options },
      { ...options }
    );
  }

  async sendMessage(
    jid,
    content,
    opt = { packname: "mask ser", author: "Mask ser" },
    type = "text"
  ) {
    switch (type.toLowerCase()) {
      case "text":
        {
          return this.client.sendMessage(
            jid,
            {
              text: content,
              ...opt,
            },
            { ...opt }
          );
        }
        break;
      case "image":
        {
          if (Buffer.isBuffer(content)) {
            return this.client.sendMessage(
              jid,
              { image: content, ...opt },
              { ...opt }
            );
          } else if (isUrl(content)) {
            return this.client.sendMessage(
              jid,
              { image: { url: content }, ...opt },
              { ...opt }
            );
          }
        }
        break;
      case "video": {
        if (Buffer.isBuffer(content)) {
          return this.client.sendMessage(
            jid,
            { video: content, ...opt },
            { ...opt }
          );
        } else if (isUrl(content)) {
          return this.client.sendMessage(
            jid,
            { video: { url: content }, ...opt },
            { ...opt }
          );
        }
      }
      case "audio":
        {
          if (Buffer.isBuffer(content)) {
            return this.client.sendMessage(
              jid,
              { audio: content, ...opt },
              { ...opt }
            );
          } else if (isUrl(content)) {
            return this.client.sendMessage(
              jid,
              { audio: { url: content }, ...opt },
              { ...opt }
            );
          }
        }
        break;
      case "template":
        let optional = await generateWAMessage(jid, content, opt);
        let message = {
          viewOnceMessage: {
            message: {
              ...optional.message,
            },
          },
        };
        await this.client.relayMessage(jid, message, {
          messageId: optional.key.id,
        });

        break;
      case "interactive":
        const genMessage = createInteractiveMessage(content);
        await this.client.relayMessage(jid, genMessage.message, {
          messageId: genMessage.key.id,
        });

        break;
      case "sticker":
        {
          let { data, mime } = await getFile(content);
          if (mime == "image/webp") {
            let buff = await writeExifWebp(data, opt);
            await this.client.sendMessage(
              jid,
              { sticker: { url: buff }, ...opt },
              opt
            );
          } else {
            mime = await mime.split("/")[0];

            if (mime === "video") {
              await this.client.sendVideoAsSticker(this.jid, content, opt);
            } else if (mime === "image") {
              await this.client.sendImageAsSticker(this.jid, content, opt);
            }
          }
        }
        break;
    }
  }
  async forward(jid, message, options = {}) {
    const m = generateWAMessageFromContent(jid, message, {
      ...options,
      userJid: this.client.user.id,
    });
    await this.client.relayMessage(jid, m.message, {
      messageId: m.key.id,
      ...options,
    });
    return m;
  }
  async forwardMessage(targetJid, message, options = {}) {
    let contentType;
    let content = message.message;
    if (options.readViewOnce) {
      content =
        content && content.ephemeralMessage && content.ephemeralMessage.message
          ? content.ephemeralMessage.message
          : content || undefined;
      const viewOnceKey = Object.keys(content)[0];
      delete (content && content.ignore
        ? content.ignore
        : content || undefined);
      delete content.viewOnceMessage.message[viewOnceKey].viewOnce;
      content = { ...content.viewOnceMessage.message };
    }
    if (options.mentions) {
      content[contentType].contextInfo.mentionedJid = options.mentions;
    }
    const forwardContent = generateForwardMessageContent(content, false);
    contentType = getContentType(forwardContent);
    if (options.ptt) forwardContent[contentType].ptt = options.ptt;
    if (options.audiowave)
      forwardContent[contentType].waveform = options.audiowave;
    if (options.seconds) forwardContent[contentType].seconds = options.seconds;
    if (options.fileLength)
      forwardContent[contentType].fileLength = options.fileLength;
    if (options.caption) forwardContent[contentType].caption = options.caption;
    if (options.contextInfo)
      forwardContent[contentType].contextInfo = options.contextInfo;
    if (options.mentions)
      forwardContent[contentType].contextInfo.mentionedJid = options.mentions;

    let contextInfo = {};
    if (contentType != "conversation") {
      contextInfo = message.message[contentType].contextInfo;
    }
    forwardContent[contentType].contextInfo = {
      ...contextInfo,
      ...forwardContent[contentType].contextInfo,
    };

    const waMessage = generateWAMessageFromContent(
      targetJid,
      forwardContent,
      options
        ? {
            ...forwardContent[contentType],
            ...options,
            ...(options.contextInfo
              ? {
                  contextInfo: {
                    ...forwardContent[contentType].contextInfo,
                    ...options.contextInfo,
                  },
                }
              : {}),
          }
        : {}
    );
    await this.client.relayMessage(targetJid, waMessage.message, {
      messageId: waMessage.key.id,
    });
    return waMessage;
  }
  async PresenceUpdate(status) {
    await sock.sendPresenceUpdate(status, this.jid);
  }
  async delete(key) {
    await this.client.sendMessage(this.jid, { delete: key });
  }
  async updateName(name) {
    await this.client.updateProfileName(name);
  }
  async getPP(jid) {
    return await this.client.profilePictureUrl(jid, "image");
  }
  async setPP(jid, pp) {
    if (Buffer.isBuffer(pp)) {
      await this.client.updateProfilePicture(jid, pp);
    } else {
      await this.client.updateProfilePicture(jid, { url: pp });
    }
  }
  /**
   *
   * @param {string} jid
   * @returns
   */
  async block(jid) {
    await this.client.updateBlockStatus(jid, "block");
  }
  /**
   *
   * @param {string} jid
   * @returns
   */
  async unblock(jid) {
    await this.client.updateBlockStatus(jid, "unblock");
  }
  /**
   *
   * @param {array} jid
   * @returns
   */
  async add(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "add");
  }
  /**
   *
   * @param {array} jid
   * @returns
   */
  async kick(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "remove");
  }

  /**
   *
   * @param {array} jid
   * @returns
   */
  async promote(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "promote");
  }
  /**
   *
   * @param {array} jid
   * @returns
   */
  async demote(jid) {
    return await this.client.groupParticipantsUpdate(this.jid, jid, "demote");
  }
}

module.exports = Message;
