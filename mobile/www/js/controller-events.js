angular.module('pmreader.controllers').controller('EventsController', function($localStorage, $ionicPlatform, $scope, $ionicPopup, Data, Helper, $filter, $interval, $log, $document) {
  var vm = this;

  vm.$storage = $localStorage;

  vm.refresh = function() {
    Data.getEvents().then(function(response) {
      var e = []
      if (response.data.results[0].series) {
        var series = response.data.results[0].series[0];
        for (var i = series.values.length - 1; i >= 0; i--) {
          var value = series.values[i];
          var object = {};
          for (var j = 0; j < value.length; j++) {
            object[series.columns[j]] = value[j]
          }
          e.push(object);
        }
      }
      vm.events = e;
    }, function() {
      vm.events = [];
    }).finally(function() {
      // Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    });;
  }


  var showPopup = function() {
    vm.data = {};

    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      template: '<input ng-model="ctrl.data.comment">',
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
  };
  vm.end = function() {
    vm.endTime = (new Date()).getTime();
    $interval.cancel(vm.refreshTimer);
    showPopup();
  };


  $scope.$watch(function() {
    return angular.toJson($localStorage);
  }, function() {
    vm.refresh();
  });

  vm.refresh();

  //chart configuration
  //This is not a highcharts object. It just looks a little like one!
  vm.chartConfig = {
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
        text: 'Date'
      }
    }, //The below properties are watched separately for changes.
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
    useHighStocks: true
  };

  var setPastChart = function(event) {
    Data.pastChart(event).then(function successCallback(response) {
      if (response.data.results[0].series) {
        Helper.fillChart(vm.chartConfig, response.data.results[0].series[0].values);
      }
    }, function errorCallback(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  };
  vm.hideEvent = function(e) {
    vm.event = null;
    vm.hardback();
  }
  vm.showEvent = function(event) {
    vm.event = event;
    vm.hardback = $ionicPlatform.registerBackButtonAction(
      vm.hideEvent, 101
    );
    setPastChart(event);
  }
});
