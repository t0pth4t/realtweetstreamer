'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('AppCtrl', function ($scope, socket) {})
  .controller('StreamCtrl', function ($scope, socket) {

    socket.on('data',function(data){
      if(data === null){
        return;
      }
      $scope.totalTweets = data.totalTweets;
      $scope.lastUpdated = data.lastUpdated;
      $scope.recentTweets = data.recentTweets;
      $scope.tweetsPerMinute = data.tweetsPerMinute;
      $scope.symbols = [];
      for(var key in data.symbols){
        var val = data.symbols[key] / $scope.totalTweets;
        if(isNaN(val)){
          val = 0;
        }
        $scope.symbols.push({
          symbol: key,
          value: Math.round(val *255),
          recentTweet: data.recentTweets[key]
        });
      }
      $scope.predicate = '-value';
      if($scope.minutesLength === undefined || data.minutes.length > $scope.minutesLength){
        $scope.minutesLength = data.minutes.length;
        //Get context with jQuery - using jQuery's .get() method.
        var ctx = $('#myChart').get(0).getContext('2d');
        var dataset = [];
        dataset.push( {
              fillColor : 'rgba(220,220,220,0.5)',
              strokeColor : 'rgba(220,220,220,1)',
              pointColor : 'rgba(220,220,220,1)',
              pointStrokeColor : '#fff',
              data : data.tpm
            });

        for(var sym in data.symbols){
          dataset.push({
              fillColor : 'rgba(0,40,89,0.5)',
              strokeColor : 'rgba(243,106,38,1)',
              pointColor : 'rgba(0,40,89,1)',
              pointStrokeColor : 'rgba(243,106,38,1)',
              data : data.trendingTweetsPerMinute[sym]
            });
        
        }
         var graph = {
          labels : data.minutes,
          datasets : dataset
        };

        //This will get the first returned node in the jQuery collection.
        new Chart(ctx).Line(graph);
      }
    });
  });
