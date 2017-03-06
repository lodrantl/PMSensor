angular.module('pmreader.controllers')
  .controller('ChartController', function($rootScope, $localStorage, $scope, Data, $interval, $log, Helper) {
    var vm = this;

    vm.$storage = $localStorage;

    //chart configuration
    $rootScope.chartConfig = {
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
  });
