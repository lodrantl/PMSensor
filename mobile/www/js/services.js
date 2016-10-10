angular.module('pmreader.services', ["ngStorage"])

.factory('Data', function($http, $localStorage) {

  return {
    current: function() {
      return $http({
        method: 'GET',
        url: $localStorage.url.replace(/\/$/, "") + "/query",
        params: {
          pretty: true,
          db: "pm",
          q: 'select * from "particulates.' + $localStorage.sensorId + '" where time > now() - 5m order by time desc limit 1'
        }
      });
    },
    currentChart: function() {
      return $http({
        method: 'GET',
        url: $localStorage.url.replace(/\/$/, "") + "/query",
        params: {
          pretty: true,
          db: "pm",
          q: 'select * from "particulates.' + $localStorage.sensorId + '" where time > now() - ' + $localStorage.time + 's'
        }
      });
    },
    getEvents: function() {
      return $http({
        method: 'GET',
        url: $localStorage.url.replace(/\/$/, "") + "/query",
        params: {
          pretty: true,
          db: "pm",
          q: 'select * from "events.' + $localStorage.sensorId + '"'
        }
      });
    },
    addEvent: function(starts, ends, comment) {
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
  };
});
