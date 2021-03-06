var EventEmitter = require("events").EventEmitter,
    emitter = new EventEmitter();

module.exports = AJAXtoIRC;

var idle = 0;

function AJAXtoIRC (url) {

var request = require('request'),
    jsdom   = require('jsdom'),
    fs      = require('fs'),
    async   = require('async');


    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    };

    var fixHTML = function(message, i, callback) {
        var j = 0;
        fixUsername(message.username, function(err, username) {
            message.username = username;
            j++;
            if (j == 2) {callback(null, i, message)};
        });

        fixSmiley(message.message, function(err, rMessage) {
            message.message = rMessage;
            j++;
            if (j == 2) {callback(null, i, message)};
        })

    };

    var fixUsername = function(username, callback) {
        if (username.slice(0, 5) == '<span') {
            jsdom.env(
                username,
                ["http://code.jquery.com/jquery.js"],
                function(errors, window) {
                    if (errors) return callback(errors, username);

                    return callback(null, window.$('span').text());
                }
            );
        } else {
            return callback(null, username);
        }
    }

    var fixSmiley = function(message, callback) {

        var smiley = message.substring(message.indexOf('<img src='), message.indexOf('" />'));
        if (smiley !== '') {
            smiley += '" />';
        } else {
            return callback(null, message);
        }

        jsdom.env(
            message,
            ["http://code.jquery.com/jquery.js"],
            function(errors, window) {
            	if (errors) return callback(errors, message);
                var cMessage = message.replace(smiley, window.$('img').attr('title'));
                return fixSmiley(cMessage, callback);
            }
        );

    }

    var prepareMessages = function(messages) {
        
        for (var i = 0; i < messages.length; i++) {
            emitter.emit('message', {
                username: messages[i].username,
                message: messages[i].message
            });
        }

    }

    var lastTransferedMessage = 1;

    async.forever(function(callback) {

            request.get(url + lastTransferedMessage, function(err, response, body) {      
                if (!err && response.statusCode == 200) {
                    
                    var data = JSON.parse(body.trim());
                    
                    if (idle > 1000) {
                    	lastTransferedMessage = 0;
                    	idle = 0;
                    }

                    if(data.lastTransferedMessage !== 0) {
                        lastTransferedMessage = data.lastTransferedMessage;
                        idle = 0;
                    } else {
                    	idle++;
                    }

                    var j = data.newMessages.length;

                    for (var i = 0; i < data.newMessages.length; i++) {

                        fixHTML(data.newMessages[i], i, function(err, id, message) {
                            data.newMessages[id] = message;
                            j--;
                            if (j == 0) {
                                prepareMessages(data.newMessages);
                            }
                        });
                    }

                    

                } else {
                    emitter.emit('error', 'Error pulling data! ' + response.statusCode);
                }
                console.log('ltM: ' + lastTransferedMessage);
                console.log('IDLE: ' + idle);
                setTimeout(callback, 5000);

            });

        }
    );

    return emitter;

}
