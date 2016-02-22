var request = require('request');
/**/
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
/**/
var Botkit = require('botkit');
var controller = Botkit.slackbot();
var bot = controller.spawn({
  token: process.env.TokenSlack
});

var Credenciais = null;


bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});




controller.hears(['hello','hi'],'ambient',function(bot, message) {

    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    },function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(',err);
        }
    });


    controller.storage.users.get(message.user,function(err, user) {
        if (user && user.name) {
            bot.reply(message,'Hello ' + user.name + '!!');
        } else {
            bot.reply(message,'Hello.');
        }
    });
});

controller.hears(['call me (.*)'],'direct_message,direct_mention,mention',function(bot, message) {
    var matches = message.text.match(/call me (.*)/i);
    var name = matches[1];
    controller.storage.users.get(message.user,function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user,function(err, id) {
            bot.reply(message,'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});


controller.hears(['what is my name','who am i'],'direct_message,direct_mention,mention',function(bot, message) {

    controller.storage.users.get(message.user,function(err, user) {
        if (user && user.name) {
            bot.reply(message,'Your name is ' + user.name);
        } else {
            bot.reply(message,'I don\'t know yet!');
        }
    });
});



controller.hears(['talk'],'direct_message,direct_mention,mention',function(bot, message) {

    bot.startConversation(message,function(err, convo) {

        convo.ask('You want a job?',[
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                	bot.api.reactions.add({
				        timestamp: response.ts,
				        channel: response.channel,
				        name: '+1',
				    });
                    convo.say('Nice :)');
                    console.log("Conversation\n"+convo.extractResponses());
                    convo.next();
                }
            },
	        {
	            pattern: bot.utterances.no,
	            callback: function(response, convo) {
	                convo.ask('Why??',function(response,convo){
	                	convo.say('"'+response.text+'", ok!!');
	                	convo.next();
	                	});
	                convo.next();
	        	}
	    	},
	        {
	        	default: true,
	        	callback: function(response,convo){
	        		convo.say("Are you drunk?");
	        		convo.repeat();
	        		convo.next();
	        	}
	        }
        ]);

    });
});

controller.hears(['how is the weather in (.*)'],'direct_message,direct_mention,mention',function(bot, message) {
    var matches = message.text.match(/how is the weather in (.*)/i);
    var cidade = matches[1];

    bot.reply(message,'i will check the weather in ' + cidade);
	 	request('https://query.yahooapis.com/v1/public/yql?q=select * from weather.forecast where woeid in (select woeid from geo.places(1) where text="'+cidade+'")&format=json',
	 	 function (error, response, body) {
        if (!error && response.statusCode == 200) {
        	var json = JSON.parse(body);
        	bot.reply(message,'is ' + json.query.results.channel.item.condition.text);
            //console.log(json.query.results.channel.item.condition.text);
        }else{
         bot.reply(message,'no clue!!');
     	}
    	});
});


controller.startConversation


controller.hears(['show files'],'direct_message,direct_mention,mention',function(bot, message) {
    bot.reply(message,'let me see');

    authorize(Credenciais, function listFiles(auth) {
		  var service = google.drive('v3');
		  service.files.list({
		    auth: auth,
		    pageSize: 10,
		    fields: "nextPageToken, files(id, name)"
		  }, function(err, response) {
		    if (err) {
		      console.log('The API returned an error: ' + err);
		      return;
		    }
		    var files = response.files;
		    if (files.length == 0) {
		      bot.reply(message,'No files found.');
		    } else {
		      bot.reply(message,'you have...');
		      for (var i = 0; i < files.length; i++) {
		        var file = files[i];
		        bot.reply(message, file.name );//+ ' ('+ file.id +')');
		      }
		    }
		  });
		});

});


// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/drive-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'drive-nodejs-quickstart.json';



	// Load client secrets from a local file.
	fs.readFile('client_secret.json', function processClientSecrets(err, content) {
	  if (err) {
	    console.log('Error loading client secret file: ' + err);
	    return;
	  }
	  // Authorize a client with the loaded credentials, then call the
	  // Drive API.
	  Credenciais = JSON.parse(content);
	  authorize(Credenciais, null);//listFiles);
	});


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      if(callback)
      	callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  var service = google.drive('v3');
  service.files.list({
    auth: auth,
    pageSize: 10,
    fields: "nextPageToken, files(id, name)"
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var files = response.files;
    if (files.length == 0) {
      console.log('No files found.');
    } else {
      console.log('Files:');
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        console.log('%s (%s)', file.name, file.id);
      }
    }
  });
}