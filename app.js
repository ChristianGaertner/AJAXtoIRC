var ATI = require('./ajaxToIrc'),
	irc = require('ircdjs').Server,
	async = require('async');

var server = null;
irc.boot(function(err, serv) {
	server = serv;
});

var ati = new ATI('http://minecraft-server.eu/board/qry.php?upTo=');


ati.on('error', function(message) {
	console.log(message);
});

ati.on('message', function(data) {
	data.username = data.username.replace(/\s+/g, '-');

	if (server != null) {

		var keys = Object.keys(server.channels.registered);
		var channel = server.channels.registered[keys[0]]
		
		if (channel !== null) {
			channel.send(':' + data.username + '!~' + data.username + '@minecraft-server.eu PRIVMSG #mc-server :' + data.message);	
		}
	}
});