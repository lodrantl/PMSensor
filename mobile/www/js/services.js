angular.module('pmreader.services', ["ngStorage"])
  .factory('Data', function($http, $localStorage, $q, $log, $rootScope, $timeout, Charts) {
    //Select data where time is later than
    function query(data, time) {
      return ' SELECT ' + data + ' FROM "particulates.' + $localStorage.sensorId + '" WHERE time > ' + time + ' ';
    };
    //Group data, so at most 150 points are requested
    function groupTime(time) {
      var g = time / 150;
      return ' GROUP BY *, time(' + Math.ceil(g) + 's) ';
    };

    //Requests latest value and writes it into rootScope
    function currentValue() {
      if ($localStorage.url && $localStorage.sensorId != null) {
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
            var r = response.data.results[0].series[0].values[0];
            $rootScope.current_10 = r[1];
            $rootScope.current_25 = r[2];
          } else {
            $rootScope.current_10 = null;
            $rootScope.current_25 = null;
          }
        }, function errorCallback(response) {
          $rootScope.current_10 = null;
          $rootScope.current_25 = null;
        }).finally(function(response) {
          $timeout(currentValue, 1000);
        });;
      } else {
        $timeout(currentValue, 1000);
      }
    };

    //Requests latest graph and writes it into rootScope
    function currentChart() {
      if ($localStorage.url  && $localStorage.sensorId != null) {
        var time = $localStorage.time;
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
            var data = response.data.results[0].series[0].values;
            Charts.fillChart($rootScope.chartConfig, data);
          } else {
            Charts.emptyChart($rootScope.chartConfig);
          }
        }, function errorCallback(response) {
          Charts.emptyChart($rootScope.chartConfig);
        }).finally(function(response) {
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
        if ($localStorage.url && $localStorage.sensorId != null) {
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
        if ($localStorage.url && $localStorage.sensorId != null) {
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
        if ($localStorage.url && $localStorage.sensorId != null) {
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
      },
      getSensorIds: function(canceler) {
        if ($localStorage.url) {
          return $http({
            method: 'GET',
            url: $localStorage.url.replace(/\/$/, "") + "/query",
            params: {
              pretty: true,
              db: "pm",
              q: 'SHOW MEASUREMENTS'
            },
            timeout: canceler.promise
          }).then(function(response) {
            var ids = [];
            if (response.data.results[0].series) {
              var series = response.data.results[0].series[0];
              for (var i = series.values.length - 1; i >= 0; i--) {
                var value = series.values[i][0];
                if (value.startsWith('particulates.')) {
                  ids.push(value.substring(13));
                }
              }
            };
            return ids;
          });
        }
        return $q.reject("No url");
      }
    };
  })
  .factory('Charts', function() {
    return {
      fillChart: function(chartConfig, currentChart) {
        if (currentChart && chartConfig && chartConfig.series) {
          var series = chartConfig.series;
          this.emptyChart(chartConfig);
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
      },
      emptyChart: function(chartConfig) {
        if (chartConfig && chartConfig.series) {
          chartConfig.series[0].data.length = 0;
          chartConfig.series[1].data.length = 0;
        }
      }
    }
  });
