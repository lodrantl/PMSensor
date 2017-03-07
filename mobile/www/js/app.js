// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('pmreader', ['ionic', 'pmreader.controllers', 'pmreader.services', "highcharts-ng", "ngStorage"])

.run(function($ionicPlatform, $localStorage, $window, $log, $rootScope, $timeout, $state) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)


    if ($window.cordova && $window.cordova.plugins && $window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if ($window.StatusBar) {
      // org.apache.cordova.statusbar requ@ired
      StatusBar.styleDefault();
    }

    if (!$localStorage.time) {
      $localStorage.time = 60;
    }
    if (!$localStorage.timeUnit) {
      $localStorage.timeUnit = "s";
    }

    if ($window.cordova && $window.cordova.plugins && $window.cordova.plugins.zeroconf) {
      cordova.plugins.zeroconf.watch('_influxdb._tcp', '.local.', function(result) {
        var action = result.action;
        var service = result.service;
        var sensorId = service.txtRecord.sensorId;

        if (action == 'added') {
          $log.log('service added', service);
          var e = {'url': 'http://' + service.ipv4Addresses[0] + ":" + service.port, 'id': sensorId};
          for (c in $localStorage.boxes) {
            if (c.url == e.url && c.id == e.id) {
              return;
            }
          }
          if ($state.current.name == 'tab.config') {
            $rootScope.$broadcast('boxFound', e);
          } else {
            $state.go("tab.config", {'d': e });
          }
        } else {
          $log.log('service removed', service);
        }
      });
    }
    Highcharts.setOptions({
      global: {
        /**
         * Use moment-timezone.js to return the timezone offset for individual
         * timestamps, used in the X axis labels and the tooltip header.
         */
        getTimezoneOffset: function(timestamp) {
          var timezoneOffset = (new Date()).getTimezoneOffset();
          return timezoneOffset;
        }
      }
    });
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  // Each tab has its own nav history stack:

  .state('tab.chart', {
    url: '/chart',
    views: {
      'tab-chart': {
        templateUrl: 'templates/tab-chart.html',
      }
    }
  })

  .state('tab.events', {
      url: '/events',
      views: {
        'tab-events': {
          templateUrl: 'templates/tab-events.html',
        }
      }
    })
    /*  .state('tab.event-detail', {
        url: '/events/:eventId',
        views: {
          'tab-events': {
            templateUrl: 'templates/event-details.html',
            controller: 'EventDetailController'
          }
        }
      })*/
    .state('tab.config', {
      url: '/config',
      views: {
        'tab-config': {
          templateUrl: 'templates/tab-config.html',
        }
      },
      params: {
        d: null
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/chart');

})
