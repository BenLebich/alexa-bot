const botconfig = require("./botconfig.json");
const Discord = require("discord.js");
const YTDL = require("ytdl-core");

const bot = new Discord.Client({disableEveryone: true});

function play(connection, message) {
  var server = servers[message.guild.id];
  bot.user.setActivity("Music", {type: "PLAYING"});
  server.dispatcher = connection.playStream(YTDL(server.queue[0], {filter: "audioonly"}));

  server.queue.shift();

  server.dispatcher.on("end", function() {
    if (server.queue[0]) play(connection, message);
    else connection.disconnect();
  });
}

var servers = {};

bot.on("ready", async () => {
  console.log(`${bot.user.username} is online!`);
  bot.user.setActivity("\"Nothing\"", {type: "PLAYING"});
});

bot.on("message", async message => {
  if(message.author.bot) return;
  if(message.channel.type === "dm") return;

  let prefix = botconfig.prefix;
  let messageArray = message.content.split(" ");
  console.log(messageArray);
  let cmd = messageArray[0];
  console.log("CMD: " + cmd);
  let args = messageArray.slice(1);
  console.log("ARGS: " + args)


  if(cmd === `${prefix}commands`) {

    let sicon = message.guild.iconURL;
    let serverembed = new Discord.RichEmbed()
    .setDescription("Server Commands")
    .setColor("#15f153")
    .setThumbnail(sicon)
    .addField("Server info", "!serverinfo")
    .addField("Bot info", "!botinfo")
    .addField("Report User", "!report @user some reason")
    .addField("Random Quote", "!getquote");
    console.log("Listing Commands");
    return message.channel.send(serverembed);
  }

  if(cmd === `${prefix}play`) {

    if(!messageArray[1]) {
      message.channel.sendMessage("Please provide a link");
      return;
    }

    if(!message.member.voiceChannel) {
      message.channel.sendMessage("You must be in a voice channel");
      return;
    }

    if(!servers[message.guild.id]) servers[message.guild.id] = {
      queue: []
    }

    var server = servers[message.guild.id];

    server.queue.push(messageArray[1]);

    if (!message.guild.voiceConnection) message.member.voiceChannel.join().then(function(connection) {
      play(connection, message);
    });

    return;
  }

  if(cmd === `${prefix}skip`) {

    var server = servers[message.guild.id];

    if(server.dispatcher) server.dispatcher.end();

    return;
  }

  if(cmd === `${prefix}stop`) {

    var server = servers[message.guild.id];

    if(message.guild.voiceConnection) message.guild.voiceConnection.disconnect()
    bot.user.setActivity("\"Nothing\"", {type: "PLAYING"});
    return;
  }

  if(cmd === `${prefix}getquote`) {

    const https = require('https');

    https.get('https://quotesondesign.com/wp-json/posts?filter[orderby]=rand&filter[posts_per_page]=1', (resp) => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        //console.log(JSON.parse(data).explanation);
        data = JSON.parse(data);
        data = data[0];
        console.log(data);
        console.log(data.title);
        console.log(data.content);
        let icon = "https://banner2.kisspng.com/20180421/eew/kisspng-quotation-marks-in-english-quotation-5adb42237380e0.5406115615243187554731.jpg";
        let quoteembed = new Discord.RichEmbed()
        .setDescription("Random Quote")
        .setColor("#15f153")
        .setThumbnail(icon)
        .addField("Title", data.title)
        .addField("Content", data.content);

        return message.channel.send(quoteembed);
      });

    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });


    return;
  }


  if(cmd === `${prefix}report`) {
    //!report @ben this is the reason

    let rUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if(!rUser) return message.channel.send("No user found");
    let reason = args.join(" ").slice(22);

    let reportEmbed = new Discord.RichEmbed()
    .setDescription("Reports")
    .setColor("#15f153")
    .addField("Reported User", `${rUser} with ID: ${rUser.id}`)
    .addField("Reported By", `${message.author} with ID: ${message.author.id}`)
    .addField("Channel", message.channel)
    .addField("Time", message.createdAt)
    .addField("Reason", reason);

    let reportschannel = message.guild.channels.find(`name`, "reports");
    if(!reportschannel) return message.channel.send("Couldn't find reports channel");

    message.delete().catch(O_o=>{});
    reportschannel.send(reportEmbed);

    return;

  }


  if(cmd === `${prefix}serverinfo`) {

    let sicon = message.guild.iconURL;
    let serverembed = new Discord.RichEmbed()
    .setDescription("Server Information")
    .setColor("#15f153")
    .setThumbnail(sicon)
    .addField("Server Name", message.guild.name)
    .addField("Created On", message.guild.createdAt)
    .addField("You Joined", message.member.joinedAt)
    .addField("Total Members", message.guild.memberCount);

    return message.channel.send(serverembed);
  }

  if(cmd === `${prefix}botinfo`) {

    let bicon = bot.user.displayAvatarURL;
    let botembed = new Discord.RichEmbed()
    .setDescription("Bot Information")
    .setColor("#15f153")
    .setThumbnail(bicon)
    .addField("Bot Name", bot.user.username)
    .addField("Created On", bot.user.createdAt);

    return message.channel.send(botembed);
  }

});

bot.login(botconfig.token);
