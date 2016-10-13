angular.module('pmreader.services', ["ngStorage"])
  .factory('Data', function($http, $localStorage, $q) {

    return {
      current: function() {
        if ($localStorage.url) {
          return $http({
            method: 'GET',
            url: $localStorage.url.replace(/\/$/, "") + "/query",
            params: {
              pretty: true,
              db: "pm",
              q: 'select * from "particulates.' + $localStorage.sensorId + '" where time > now() - 5m order by time desc limit 1'
            }
          });
        }
        return $q.reject("No url");
      },
      currentChart: function() {
        if ($localStorage.url) {
          return $http({
            method: 'GET',
            url: $localStorage.url.replace(/\/$/, "") + "/query",
            params: {
              pretty: true,
              db: "pm",
              q: 'select * from "particulates.' + $localStorage.sensorId + '" where time > now() - ' + $localStorage.time + 's'
            }
          });
        }
        return $q.reject("No url");
      },
      pastChart: function(event) {
        if ($localStorage.url) {
          var start = (new Date(event.starts)).toISOString();
          var end = (new Date(event.ends)).toISOString();

          return $http({
            method: 'GET',
            url: $localStorage.url.replace(/\/$/, "") + "/query",
            params: {
              pretty: true,
              db: "pm",
              q: 'select * from "particulates.' + $localStorage.sensorId + '" where time >  \'' + start + '\' and time < \'' + end + '\''
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
  });
