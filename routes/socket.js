/*
 * Serve content over a socket
 */
var moment = require('moment-timezone'),	
 cronJob = require('cron').CronJob,
 _ = require('lodash'),
 twitter = require('twit');

 if(process.env.NODE_ENV !== "production"){
 	config = require('../config')
 }

module.exports = function (socket) {
	socket.on('error',function(err){
		console.log('An error occurred : ' + err.stack);
	});
	socket.emit('data',watchList);

    var watchSymbols = ['node.js','nodeJX','angular.js', 'knockout.js', 'javascript','ember.js','socket.io','backbone.js','meteor.js','grunt.js','three.js','asm.js','express.js','underscore.js','spine.js','sproutcore','jquery','lodash.js','dojo.js','batman.js','can.js'];
	var watchList = {
		totalTweets: 0,
		symbols: {},
		recentTweets: {},
		lastUpdated: "",
		tweetsPerMinute: 0,
		tpm: [],
		btpm:[],
		stpm:[],
		minutes: []
	};

	_.each(watchSymbols, function(value){
		watchList.recentTweets[value] = "";
		watchList.symbols[value] = 0;
	});

	var twit = "";
	if(process.env.NODE_ENV === "production"){
		twit = new twitter({
			consumer_key= process.env.CONSUMER_KEY,
    		consumer_secret= process.env.CONSUMER_SECRET,        
    		access_token= process.env.ACCESS_TOKEN_KEY,       
    		access_token_secret= process.env.ACCESS_TOKEN_SECRET
		});

	}else{		
	 twit = new twitter(config);
	}


var start = moment();
var tweetsPerMinute = 0;
var btpm = 0;
var stpm = 0;
watchList.tpm.push(0);
watchList.btpm.push(0);
watchList.stpm.push(0);
watchList.minutes.push(1);
var minutes = 1;

twit.get('trends/place', {id: 2451822},function(err,data){
	console.log(err);
	console.log(JSON.stringify(data));
});

var stream = twit.stream('statuses/filter', {track:watchSymbols, language:'en'});
	stream.on('tweet',function(tweet){
		watchList.lastUpdated = moment().tz('America/Chicago').format('MMMM Do YYYY, h:mm:ss a');
		var claimed = false;

		if(tweet.text === undefined){
			return;
		}

		var now = moment();
		tweetsPerMinute++;

		if(now.diff(start,'seconds') >= 60){
			start = now;
			watchList.tweetsPerMinute = tweetsPerMinute;
			watchList.tpm.push(tweetsPerMinute);
			watchList.minutes.push(minutes++);
			watchList.btpm.push(btpm);
			watchList.stpm.push(stpm);
			tweetsPerMinute = 0;
			btpm = 0;
			stpm = 0;
		}

		var text = tweet.text.toLowerCase();

		//_.each(watchSymbols, function(value){
		for(var i = 0; i <watchSymbols.length; ++i){
			var value = watchSymbols[i];
			if(text.indexOf(value) !== -1 ){//|| text.indexOf(value.replace('.','')) !== -1){
				
			
					watchList.symbols[value]++;
					watchList.totalTweets++;
					watchList.recentTweets[value] =tweet.user.screen_name + ": " + tweet.text;
					claimed = true;
					if(value === 'broncos'){
						btpm++;
					}
					else if(value === 'seahawks'){
						stpm++;
					}
				

			}
		
		};

		if(claimed){
			socket.emit('data',watchList);
		}
	});


	//Reset everything on a new day!
	//We don't want to keep data around from the previous day so reset everything.
	new cronJob('0 0 0 * * *', function(){
	    //Reset the total
	    watchList.totalTweets = 0;

	    //Clear out everything in the map
	    _.each(watchSymbols, function(value) { 
	    	watchList.symbols[value] = 0; 	    	
	    	watchList.recentTweets[value] = "";
	    });

	    //Send the update to the clients
	    socket.emit('data', watchList);
	}, null, true);
};
