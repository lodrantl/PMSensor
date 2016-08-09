angular.module('pmreader.controllers', ['ngStorage'])

.controller('ChartCtrl', function($scope, Data, $interval, $http) {
  var ctrl = this;

  var refreshData = function() {
    Data.current().then(function successCallback(response) {
      var currentData = response.data.results[0].series[0].values[0];
      console.log(currentData)
      $scope.current_10 = currentData[1];
      $scope.current_25 = currentData[2];
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
      data: []
    }, {
      name: "PM 2.5",
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
      var currentValues = response.data.results[0].series[0].values;

      $scope.chartConfig.series[0].data.length = 0
      $scope.chartConfig.series[1].data.length = 0
      for (var i = 0; i < currentValues.length; i++) {
        point = currentValues[i];
        var date = (new Date(point[0])).getTime();

        $scope.chartConfig.series[0].data.push([date, point[1]]);
        $scope.chartConfig.series[1].data.push([date, point[2]]);
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

.controller('EventsCtrl', function($scope, $ionicPopup, Data, $filter) {
  var refresh = function() {
    Data.getEvents().then(function(response) {
      $scope.events = []
      var series = response.data.results[0].series[0];
      for (var i = series.values.length - 1; i >= 0; i--) {
        var value = series.values[i];
        var object = {};
        for (var j = 0; j < value.length; j++) {
          object[series.columns[j]] = value[j]
        }
        $scope.events.push(object);
      }

      console.log($scope.events);
    }, function() {});
  }
  var showPopup = function() {
    $scope.data = {};

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
          if (!$scope.data.comment) {
            //don't allow the user to close unless he enters wifi password
            e.preventDefault();
          } else {
            return $scope.data.comment;
          }
        }
      }]
    });

    myPopup.then(function(res) {
      if (res) {
        Data.addEvent($scope.startTime, $scope.endTime, res).then(function() {
          refresh();
        }, function() {});
      }
      $scope.running = false;
      $scope.startTime = null;
      $scope.endTime = null;
    });
  };

  $scope.start = function() {
    $scope.startTime = (new Date()).getTime();
    $scope.running = true;
    console.log($scope.running);
  };
  $scope.end = function() {
    $scope.endTime = (new Date()).getTime();
    showPopup();
  };


  refresh();
})

.controller('ConfigCtrl', function($scope, $localStorage) {
  $scope.$storage = $localStorage;
});
