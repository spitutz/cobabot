const fs = require("fs");
const path = require("path");
const axios = require("axios");
const config = require("../config");
const fetch = require("node-fetch");
const {
  writeExifWebp,
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid,
} = require("./sticker");
const { fromBuffer } = require("file-type");

exports.getJson = async (url, options = {}) => {
  try {
    const response = await axios({
      method: "GET",
      url: url,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
      },
      ...options,
    });
    return response.data;
  } catch (error) {
    return error;
  }
};

exports.postJson = async (url, postData, options = {}) => {
  try {
    const response = await axios.request({
      url: url,
      data: JSON.stringify(postData),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });
    return response.data;
  } catch (error) {
    return error;
  }
};

exports.parsedUrl = (text = "") => {
  const matches = text.match(
    /(http|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/g
  );
  return Array.isArray(matches) ? matches : [];
};
/*
exports.isUrl = (url) => {
  return url.match(
    new RegExp(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/,
      "gi"
    )
  );
};
*/
exports.jsonFormat = (data) => {
  try {
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Error formatting JSON:", error);
    throw error; // Rethrow the error for higher-level handling
  }
};

exports.writeJsonFiles = function (jsonObj, directoryPath) {
  for (const key in jsonObj) {
    if (jsonObj.hasOwnProperty(key)) {
      const filename = key + ".json";
      const filePath = path.join(directoryPath, filename);
      const content = JSON.stringify(jsonObj[key], null, 2);
      fs.writeFile(filePath, content, "utf8", () => {});
    }
  }
};

exports.formatTime = function (seconds) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600 * 24));
  var h = Math.floor((seconds % (3600 * 24)) / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = Math.floor(seconds % 60);
  var dDisplay = d > 0 ? d + (d === 1 ? " day, " : " days, ") : "";
  var hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
};

exports.getFile = async (PATH, returnAsFilename) => {
  let res, filename;
  let data = Buffer.isBuffer(PATH)
    ? PATH
    : /^data:.*?\/.*?;base64,/i.test(PATH)
    ? Buffer.from(PATH.split`,`[1], "base64")
    : /^https?:\/\//.test(PATH)
    ? await (res = await fetch(PATH)).buffer()
    : fs.existsSync(PATH)
    ? ((filename = PATH), fs.readFileSync(PATH))
    : typeof PATH === "string"
    ? PATH
    : Buffer.alloc(0);
  if (!Buffer.isBuffer(data)) throw new TypeError("Result is not a buffer");
  let type = (await fromBuffer(data)) || {
    mime: "application/octet-stream",
    ext: ".bin",
  };
  if (data && returnAsFilename && !filename)
    (filename = path.join(__dirname, "../" + new Date() * 1 + "." + type.ext)),
      await fs.promises.writeFile(filename, data);
  return {
    res,
    filename,
    ...type,
    data,
  };
};

exports.sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.Imgur = async (media) => {
  const Form = require("form-data");
  const Formdata = new Form();
  Formdata.append("image", fs.createReadStream(media));
  const config = {
    method: "post",
    url: "https://api.imgur.com/3/upload",
    headers: {
      Authorization: "Client-ID 793f303296683e6",
      ...Formdata.getHeaders(),
    },
    data: Formdata,
  };
  try {
    const e = await axios(config);
    return e.data.data;
  } catch (e) {
    return e?.response?.statusText;
  }
};

exports.numToJid = (num) => num + "@s.whatsapp.net";

exports.sudoIds = async (client) =>
  (
    await client.onWhatsApp(...config.SUDO.split(",").concat(client.user.id))
  ).map(({ jid }) => jid);
