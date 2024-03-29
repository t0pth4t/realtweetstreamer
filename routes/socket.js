'use strict';
/*
 * Serve content over a socket
 */
var moment = require('moment-timezone'),
 _ = require('lodash'),
 twitter = require('twit');

if(process.env.NODE_ENV !== 'production'){
	var config = require('../config');
}

module.exports = function (socket) {
	socket.on('error',function(err){
		console.log('An error occurred : ' + err.stack);
	});

	var watchList = {
		totalTweets: 0,
		symbols: {},
		recentTweets: {},
		lastUpdated: '',
		tweetsPerMinute: 0,
		tpm: [],
		trendingTweetsPerMinute: {},
		tweetsPerMinuteCounter: {},
		minutes: []
	};

	socket.emit('data',watchList);

	var twit = '';
	if(process.env.NODE_ENV === 'production'){
		twit = new twitter({
			consumer_key: process.env.CONSUMER_KEY,
			consumer_secret: process.env.CONSUMER_SECRET,        
			access_token: process.env.ACCESS_TOKEN_KEY,       
			access_token_secret: process.env.ACCESS_TOKEN_SECRET
		});

	}else{		
		twit = new twitter(config);
	}



twit.get('trends/place', {id: 2451822},function(err,data){
	console.log(err);
	var watchSymbols = _.map(data[0].trends, function(value){return value.name.toLowerCase();});
    _.each(watchSymbols, function(value){
		watchList.recentTweets[value] = '';
		watchList.symbols[value] = 0;
		watchList.trendingTweetsPerMinute[value] = [0];
		watchList.tweetsPerMinuteCounter[value] = 0;
	});


var start = moment();
var tweetsPerMinute = 0;
watchList.tpm.push(0);
watchList.minutes.push(0);
var minutes = 0;

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
			_.each(watchSymbols, function(value){
				watchList.trendingTweetsPerMinute[value].push(watchList.tweetsPerMinuteCounter[value]);
				watchList.tweetsPerMinuteCounter[value] = 0;						
			});
			tweetsPerMinute = 0;

		}

		var text = tweet.text.toLowerCase();


		for(var i = 0; i <watchSymbols.length; ++i){
			var value = watchSymbols[i].toLowerCase();
			if(text.indexOf(value) !== -1 ){				
					watchList.symbols[value]++;
					watchList.tweetsPerMinuteCounter[value]++;
					watchList.totalTweets++;
					watchList.recentTweets[value] =tweet.user.screen_name + ': ' + tweet.text;
					claimed = true;
			}
		
		}

		if(claimed){
			socket.emit('data',watchList);
		}
	});
});

};
