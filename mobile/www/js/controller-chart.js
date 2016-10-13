angular.module('pmreader.controllers')
  .controller('ChartController', function($scope, Data, $interval) {
    var vm = this;

    var refreshData = function() {
      Data.current().then(function successCallback(response) {
        if (response.data.results[0].series) {
          var currentData = response.data.results[0].series[0].values[0];
          vm.current_10 = currentData[1];
          vm.current_25 = currentData[2];
        }
      }, function errorCallback(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
      });
    }
    vm.refreshTimer = $interval(refreshData, 1000);

    $scope.$on("$destroy", function() {
      if (angular.isDefined(ctrl.refreshTimer)) {
        $interval.cancel(ctrl.refreshTimer);
      }
    });

    refreshData();

    //chart configuration
    //This is not a highcharts object. It just looks a little like one!
    vm.chartConfig = {
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

          vm.chartConfig.series[0].data.length = 0
          vm.chartConfig.series[1].data.length = 0
          for (var i = 0; i < currentValues.length; i++) {
            point = currentValues[i];
            var date = (new Date(point[0])).getTime();

            vm.chartConfig.series[0].data.push([date, point[1]]);
            vm.chartConfig.series[1].data.push([date, point[2]]);
          }
        }
      }, function errorCallback(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
      });
    }
    vm.refreshChartTimer = $interval(refreshChart, 1000);
    refreshChart();
    $scope.$on("$destroy", function() {
      if (angular.isDefined(ctrl.refreshChartTimer)) {
        $interval.cancel(ctrl.refreshChartTimer);
      }
    });
  });
