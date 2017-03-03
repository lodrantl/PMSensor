angular.module('pmreader.controllers')
  .controller('ChartController', function($scope, Data, $interval, $log, Charts) {
    var vm = this;

    var refreshData = function() {
      if ($scope.currentValues) {
        vm.current_10 = $scope.currentValues[1];
        vm.current_25 = $scope.currentValues[2];
      }
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
      //This is the Main Highcharts chart config. Any Highchart options are valid here.
      //will be overriden by values specified below.
      chart: {
        type: 'spline',
        zoomType: "x"
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
          text: 'Ura'
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
      Charts.fillChart(vm.chartConfig, $scope.currentChart);
    }
    vm.refreshChartTimer = $interval(refreshChart, 1000);
    refreshChart();

    $scope.$on("$destroy", function() {
      if (angular.isDefined(ctrl.refreshChartTimer)) {
        $interval.cancel(ctrl.refreshChartTimer);
      }
    });
  });
