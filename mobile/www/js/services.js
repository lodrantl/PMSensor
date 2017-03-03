angular.module('pmreader.services', ["ngStorage"])
  .factory('Data', function($http, $localStorage, $q, $log, $rootScope, $timeout) {
    //Helper functions
    var query = function(data, time) {
      return ' SELECT ' + data + ' FROM "particulates.' + $localStorage.sensorId + '" WHERE time > ' + time + ' ';
    };

    var groupTime = function(time) {
      var g = time / 150; //request at most 60 points

      return ' GROUP BY *, time(' + Math.ceil(g) + 's) ';
    };

    var currentValue = function() {
      if ($localStorage.url) {
        $http({
          method: 'GET',
          url: $localStorage.url.replace(/\/$/, "") + "/query",
          params: {
            pretty: true,
            db: "pm",
            q: query('*', 'now() - 5m') + 'ORDER BY time DESC LIMIT 1'
          }
        }).then(function successCallback(response) {
          if (response.data.results[0].series) {
            $rootScope.currentValues = response.data.results[0].series[0].values[0];
          }
          $timeout(currentValue, 1000);
        }, function errorCallback(response) {
          $timeout(currentValue, 1000);
        });
      } else {
        $timeout(currentValue, 1000);
      }
    };
    var currentChart = function() {
      if ($localStorage.url) {
        var time = $localStorage.time || 60;

        $http({
          method: 'GET',
          url: $localStorage.url.replace(/\/$/, "") + "/query",
          params: {
            pretty: true,
            db: "pm",
            q: query('MEAN(pm_10), MEAN(pm_25)', 'now() - ' + time + 's') + groupTime(time)
          }
        }).then(function successCallback(response) {
          if (response.data.results[0].series) {
            $rootScope.currentChart = response.data.results[0].series[0].values;
          }
          $timeout(currentChart, 1000);
        }, function errorCallback(response) {
          $timeout(currentChart, 1000);
        });
      } else {
        $timeout(currentChart, 1000);
      }
    }

    currentValue();
    currentChart();

    return {
      pastChart: function(event) {
        if ($localStorage.url) {
          var start = (new Date(event.starts)).toISOString();
          var end = (new Date(event.ends)).toISOString();
          var time = (event.ends - event.starts) / 1000;

          return $http({
            method: 'GET',
            url: $localStorage.url.replace(/\/$/, "") + "/query",
            params: {
              pretty: true,
              db: "pm",
              q: query('MEAN(pm_10), MEAN(pm_25)', "'" + start + "'") + 'AND time < \'' + end + "'" + groupTime(time)
            }
          });
        }
        return $q.reject("No url");
      },
      getEvents: function() {
        if ($localStorage.url) {
          return $http({
            method: 'GET',
            url: $localStorage.url.replace(/\/$/, "") + "/query",
            params: {
              pretty: true,
              db: "pm",
              q: 'select * from "events.' + $localStorage.sensorId + '"'
            }
          });
        }
        return $q.reject("No url");
      },
      addEvent: function(starts, ends, comment) {
        if ($localStorage.url) {
          return $http({
            method: 'POST',
            url: $localStorage.url.replace(/\/$/, "") + "/write",
            params: {
              db: "pm"
            },
            data: 'events.' + $localStorage.sensorId + ',sensor_id=' + $localStorage.sensorId + ' starts=' + starts + 'i,ends=' + ends + 'i,comment="' + comment + '"',
            transformRequest: false,
            headers: {
              'Content-Type': undefined
            }
          });
        }
        return $q.reject("No url");
      }
    };
  })
  .factory('Charts', function($rootScope) {
    return {
      fillChart: function(chartConfig, currentChart) {
        if (currentChart) {
          var series = chartConfig.series;
          series[0].data.length = 0;
          series[1].data.length = 0;
          for (var i = 0; i < currentChart.length; i++) {
            point = currentChart[i];
            var date = (new Date(point[0])).getTime();
            if (point[1] != null) {
              series[0].data.push([date, Math.round(10 * point[1]) / 10]);
            }
            if (point[2] != null) {
              series[1].data.push([date, Math.round(10 * point[2]) / 10]);
            }
          }
        }
      }
    }
  });
