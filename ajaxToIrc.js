module.exports = AJAXtoIRC;


function AJAXtoIRC (url) {

var request = require('request'),
    jsdom   = require('jsdom'),
    fs      = require('fs'),
    async   = require('async');


    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    };

    var lastTransferedMessage = 1;

    var main = {
        newMessage: function() {},
        debug: false,
        eventlisteners: {},
        on: function(type, callback) {
            main.eventlisteners.type = callback;
        },
        triggerEvent: function(type, message, data) {
            return main.eventlisteners.type(message, data);
        }
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
            main.triggerEvent('message', messages[i].username, messages[i].message);
        }

    }

    async.forever(
        function(callback) {

            request.get(url + lastTransferedMessage, function(err, response, body) {
                if (!err && response.statusCode == 200) {
                    var data = JSON.parse(body.trim());
                    
                    if (main.debug) {
                    	console.log(data);
                    	console.log(lastTransferedMessage);
                    }
                    
                    if(data.lastTransferedMessage !== 0) {
                        lastTransferedMessage = data.lastTransferedMessage;
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
                    main.triggerEvent('error', 'Error pulling data! ' + response.statusCode);
                }
            });

            setTimeout(callback, 5000);

        }
    );

    return main;

}