angular.module('pmreader.controllers', ['ngStorage'])

.controller('ChartCtrl', function($scope, Data, $interval, $http) {
  var ctrl = this;
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
  var refreshData = function() {
    Data.current().then(function successCallback(response) {
      if (response.data.results[0].series) {
        var currentData = response.data.results[0].series[0].values[0];
        $scope.current_10 = currentData[1];
        $scope.current_25 = currentData[2];
      }
    }, function errorCallback(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  }
  ctrl.refreshTimer = $interval(refreshData, 1000);

  $scope.$on("$destroy", function() {
    if (angular.isDefined(ctrl.refreshTimer)) {
      $interval.cancel(ctrl.refreshTimer);
    }
  });

  refreshData();

  //chart configuration
  //This is not a highcharts object. It just looks a little like one!
  $scope.chartConfig = {
    options: {
      //This is the Main Highcharts chart config. Any Highchart options are valid here.
      //will be overriden by values specified below.
      chart: {
        type: 'spline'
      },
      yAxis: {
        title: {
          useHTML: true,
          text: 'Število delcev [&#181;g/m<sup>3</sup>]'
        }
      },
      tooltip: {
        style: {
          padding: 10,
          fontWeight: 'bold'
        }
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: { // don't display the dummy year
          month: '%e. %b',
          year: '%b'
        },
        title: {
          text: 'Date'
        }
      }
    },
    //The below properties are watched separately for changes.
    //Title configuration (optional)
    title: {
      text: 'Prašni delci v zraku'
    },
    series: [{
      name: "PM 10",
      color: "blue",
      data: []
    }, {
      name: "PM 2.5",
      color: "red",
      data: []
    }],
    //Boolean to control showing loading status on chart (optional)
    //Could be a string if you want to show specific loading text.
    loading: false,
    //Whether to use Highstocks instead of Highcharts (optional). Defaults to false.
    useHighStocks: false
  };

  var refreshChart = function() {
    Data.currentChart().then(function successCallback(response) {
      if (response.data.results[0].series) {
        var currentValues = response.data.results[0].series[0].values;

        $scope.chartConfig.series[0].data.length = 0
        $scope.chartConfig.series[1].data.length = 0
        for (var i = 0; i < currentValues.length; i++) {
          point = currentValues[i];
          var date = (new Date(point[0])).getTime();

          $scope.chartConfig.series[0].data.push([date, point[1]]);
          $scope.chartConfig.series[1].data.push([date, point[2]]);
        }
      }
    }, function errorCallback(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  }
  ctrl.refreshChartTimer = $interval(refreshChart, 1000);
  refreshChart();
  $scope.$on("$destroy", function() {
    if (angular.isDefined(ctrl.refreshChartTimer)) {
      $interval.cancel(ctrl.refreshChartTimer);
    }
  });
})

.controller('EventsCtrl', function($scope, $ionicPopup, Data, $filter, $interval, $log) {
  var vm = $scope;
  vm.refresh = function() {
    Data.getEvents().then(function(response) {
      vm.events = []
      if (response.data.results[0].series) {
        var series = response.data.results[0].series[0];
        for (var i = series.values.length - 1; i >= 0; i--) {
          var value = series.values[i];
          var object = {};
          for (var j = 0; j < value.length; j++) {
            object[series.columns[j]] = value[j]
          }
          $scope.events.push(object);
        }
      }
      console.log(vm.events);
    }, function() {}).finally(function() {
      // Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    });;
  }
  var showPopup = function() {
    vm.data = {};

    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      template: '<input ng-model="data.comment">',
      title: 'Opis meritve',
      scope: $scope,
      buttons: [{
        text: 'Prekliči'
      }, {
        text: '<b>Save</b>',
        type: 'button-positive',
        onTap: function(e) {
          if (!vm.data.comment) {
            //don't allow the user to close unless he enters wifi password
            e.preventDefault();
          } else {
            return vm.data.comment;
          }
        }
      }]
    });

    myPopup.then(function(res) {
      if (res) {
        Data.addEvent(vm.startTime, vm.endTime, res).then(function() {
          vm.refresh();
        }, function() {});
      }
      vm.running = false;
      vm.startTime = null;
      vm.endTime = null;
    });
  };
  var setCurrentTime = function() {
    vm.currentTime = new Date(null);
    vm.currentTime.setSeconds(Math.floor(((new Date()).getTime() - vm.startTime) / 1000))
  }
  vm.start = function() {
    vm.startTime = (new Date()).getTime();
    vm.running = true;
    vm.refreshTimer = $interval(setCurrentTime, 1000);
    console.log(vm.running);
  };
  vm.end = function() {
    vm.endTime = (new Date()).getTime();
    $interval.cancel(vm.refreshTimer);
    showPopup();
  };


  vm.refresh();
})

.controller('ConfigCtrl', function($scope, $localStorage) {
  $scope.$storage = $localStorage;
});
