var Botkit = require('botkit');
var controller = Botkit.slackbot();

var bot = controller.spawn({
  token: process.env.botToken
});



controller.configureSlackApp({
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  redirectUri: 'http://localhost:3002',
  /*
		NAO ESTA A TER QUALQUER EFEITO QUANDO REMOVO POR EXEMPLO 'groups:read'
  */
  scopes: ['incoming-webhook','team:read','users:read','channels:read','im:read','im:write','groups:read','emoji:read','chat:write:bot']
});

controller.setupWebserver(3000,function(err,webserver) {

  // set up web endpoints for oauth, receiving webhooks, etc.
  controller
    .createHomepageEndpoint(controller.webserver)
    .createOauthEndpoints(controller.webserver,function(err,req,res) { 

    })
    .createWebhookEndpoints(controller.webserver);

});



bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});


controller.hears(['hello','hi'],'ambient',function(bot, message) {

    bot.api.groups.list({},function(err,response) {
    console.log(response);
    if(response.groups.length > 0){
    	var text = "Groups = ";
    	for(var i=0; i < response.groups.length; i++){
    		text += response.groups[i].name + " ";
    	}
      bot.reply(message, text);
    }
  	else
  		bot.reply(message,'I can\'t list private groups');
  });

    bot.api.groups.open({channel:'G0NQW6TC1'}, function(bot,message){
      console.log("a tentar entrar no canal");
      console.log(message);
  });
});