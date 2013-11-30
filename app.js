var ATI = require('./ajaxToIrc'),
	irc = require('ircdjs').Server,
	async = require('async');

var server = null;
irc.boot(function(err, serv) {
	server = serv;
});

var ati = new ATI('http://minecraft-server.eu/board/qrsy.php?upTo=');


ati.on('error', function(message) {
	console.log(message);
});

ati.on('message', function(username, message) {
	console.log(message);

	if (server != null) {

		var keys = Object.keys(server.channels.registered);
		var channel = server.channels.registered[keys[0]]
		
		if (channel !== null) {
			channel.send(':' + username + '!~' + username + '@minecraft-server.eu PRIVMSG #mc-server :' + message);	
		}
	}
});