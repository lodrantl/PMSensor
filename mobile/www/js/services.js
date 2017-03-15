angular.module('pmreader.services', ["ngStorage"])
  .factory('Data', function($http, $localStorage, $q, $log, $rootScope, $timeout, Helper, $httpParamSerializer) {
    //Select data where time is later than
    function query(data, time) {
      return ' SELECT ' + data + ' FROM pm_policy.particulates WHERE sensor_id = \'' + Helper.id() + '\' AND time > ' + time + ' ';
    };
    //Group data, so at most 150 points are requested
    function groupTime(time, unit) {
      var g = time / 150;
      if (!unit) {
        unit = $localStorage.timeUnit
      }
      return ' GROUP BY *, time(' + Math.ceil(g) + unit + ') ';
    };

    function semicolonSerializer(params) {
      return $httpParamSerializer(params).replace(/;/g, "%3B");
    }
    //Requests latest value and writes it into rootScope
    function current() {
      if (Helper.boxSet()) {
        var time = $localStorage.time;
        $http({
          method: 'GET',
          url: Helper.url() + "/query",
          params: {
            pretty: true,
            db: "pm",
            q: query('pm_25,pm_10', 'now() - 5m') + 'ORDER BY time DESC LIMIT 1;' +
              query('MEAN(pm_10), MEAN(pm_25)', 'now() - ' + time + $localStorage.timeUnit) + groupTime(time)
          },
          paramSerializer: semicolonSerializer
        }).then(function successCallback(response) {
          if (response.data.results[0].series) {
            $rootScope.current = response.data.results[0].series[0].values[0];
          } else {
            $rootScope.current = [null,null,null]
          }
          if (response.data.results[1].series) {
            var data = response.data.results[1].series[0].values;
            Helper.fillChart($rootScope.chartConfig, data);
          } else {
            Helper.emptyChart($rootScope.chartConfig);
          }
        }, function errorCallback(response) {
          $rootScope.current = [null,null,null]
          Helper.emptyChart($rootScope.chartConfig);
        }).finally(function(response) {
          $timeout(current, 1000);
        });;
      } else {
        $rootScope.current = [null,null,null]
        Helper.emptyChart($rootScope.chartConfig);
        $timeout(current, 1000);
      }
    };

    current();


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
              q: query('MEAN(pm_10), MEAN(pm_25)', "'" + start + "'") + 'AND time < \'' + end + "'" + groupTime(time, 's')
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
              q: 'select starts,ends,comment,time from event_policy.events where sensor_id = \'' + Helper.id() + "'"
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
              db: "pm",
              rp: 'event_policy'
            },
            data: 'events,sensor_id=' + Helper.id() + ' starts=' + starts + 'i,ends=' + ends + 'i,comment="' + comment + '"',
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
            q: 'SELECT * FROM pm_policy.particulates GROUP BY sensor_id LIMIT 1'
          },
          timeout: canceler.promise
        }).then(function(response) {
          var ids = [];
          var series = response.data.results[0].series;

          if (series) {
            for (var i = 0; i < series.length; i++) {
              if (series[i].tags && series[i].tags.sensor_id) {
                ids.push(series[i].tags.sensor_id);
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
        return $localStorage.currentBox.split(":::")[1].replace(/\/$/, "")

      },
      id: function() {
        if ($localStorage.currentBox == null) {
          return null;
        }
        return $localStorage.currentBox.split(":::")[0]
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
