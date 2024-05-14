const { bot, mode} = require('../lib/');

bot({
	pattern: 'reboot',
	fromMe: mode,
	desc: 'Bot restart',
	type: 'system'
}, async (message, match, client) => {
await message.send("_rebooting_");
return require('pm2').restart('index.js');
});