angular.module('pmreader.services', ["ngStorage"])
  .factory('Data', function($http, $localStorage, $q, $log, $rootScope, $timeout, Helper) {
    //Select data where time is later than
    function query(data, time) {
      return ' SELECT ' + data + ' FROM "particulates.' + Helper.id() + '" WHERE time > ' + time + ' ';
    };
    //Group data, so at most 150 points are requested
    function groupTime(time) {
      var g = time / 150;
      return ' GROUP BY *, time(' + Math.ceil(g) + $localStorage.timeUnit + ') ';
    };

    //Requests latest value and writes it into rootScope
    function currentValue() {
      if (Helper.boxSet()) {
        $http({
          method: 'GET',
          url: Helper.url() + "/query",
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
        $rootScope.current_10 = null;
        $rootScope.current_25 = null;
        $timeout(currentValue, 1000);
      }
    };

    //Requests latest graph and writes it into rootScope
    function currentChart() {
      if (Helper.boxSet()) {
        var time = $localStorage.time;
        $http({
          method: 'GET',
          url: Helper.url() + "/query",
          params: {
            pretty: true,
            db: "pm",
            q: query('MEAN(pm_10), MEAN(pm_25)', 'now() - ' + time + $localStorage.timeUnit) + groupTime(time)
          }
        }).then(function successCallback(response) {
          if (response.data.results[0].series) {
            var data = response.data.results[0].series[0].values;
            Helper.fillChart($rootScope.chartConfig, data);
          } else {
            Helper.emptyChart($rootScope.chartConfig);
          }
        }, function errorCallback(response) {
          Helper.emptyChart($rootScope.chartConfig);
        }).finally(function(response) {
          $timeout(currentChart, 1000);
        });
      } else {
        Helper.emptyChart($rootScope.chartConfig);
        $timeout(currentChart, 1000);
      }
    }

    currentValue();
    currentChart();


    return {
      pastChart: function(event) {
        if (Helper.boxSet()) {
          var start = (new Date(event.starts)).toISOString();
          var end = (new Date(event.ends)).toISOString();
          var time = (event.ends - event.starts) / 1000;

          return $http({
            method: 'GET',
            url: Helper.url() + "/query",
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
        if (Helper.boxSet()) {
          return $http({
            method: 'GET',
            url: Helper.url() + "/query",
            params: {
              pretty: true,
              db: "pm",
              q: 'select * from "events.' + Helper.id() + '"'
            }
          });
        }
        return $q.reject("No url");
      },
      addEvent: function(starts, ends, comment) {
        if (Helper.boxSet()) {
          return $http({
            method: 'POST',
            url: Helper.url() + "/write",
            params: {
              db: "pm"
            },
            data: 'events.' + Helper.id() + ',sensor_id=' + Helper.id() + ' starts=' + starts + 'i,ends=' + ends + 'i,comment="' + comment + '"',
            transformRequest: false,
            headers: {
              'Content-Type': undefined
            }
          });
        }
        return $q.reject("No url");
      },
      getSensorIds: function(url, canceler) {
          return $http({
            method: 'GET',
            url: url.replace(/\/$/, "") + "/query",
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
    };
  })
  .factory('Helper', function($localStorage) {
    return {
      boxSet: function() {
        if ($localStorage.currentBox == null) {
          return false;
        }
        var s = $localStorage.currentBox.split(":::");
        return !(!(s[0]) || !(s[1]));
      },
      url: function() {
        if ($localStorage.currentBox == null) {
          return null;
        }
        return  $localStorage.currentBox.split(":::")[1].replace(/\/$/, "")

      },
      id: function() {
        if ($localStorage.currentBox == null) {
          return null;
        }
        return  $localStorage.currentBox.split(":::")[0]
      },
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
