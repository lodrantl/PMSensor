angular.module('pmreader.controllers')
  .controller('ConfigController', function($scope, $localStorage, Data, $log, $q) {
    var vm = this;
    vm.$storage = $localStorage;

    

    //Nasty bit of promise hacking to make the GUI nicely responsive
    function setIDs() {
      $log.log("Sensor ID", $localStorage.sensorId);
      if (vm.canceler) {
        vm.canceler.resolve();
      }
      vm.canceler = $q.defer();
      var old = vm.promise;
      if (old) {
        old.then(function() {
          vm.state = "loading";
        });
      } else {
        vm.state = "loading";
      }
      vm.promise = Data.getSensorIds(vm.canceler).then(
        function(ids) {
          if (old) {
            old.then(function() {
              if ($localStorage.sensorId == null) {
                $localStorage.sensorId = ids[0];
              }
              vm.state = "";
              vm.sensorIdOptions = ids;
            });
          } else {
            if ($localStorage.sensorId == null) {
              $localStorage.sensorId = ids[0];
            }
            vm.state = "";
            vm.sensorIdOptions = ids;
          }
        },
        function(r) {
          vm.state = "error";
          vm.sensorIdOptions = [$localStorage.sensorId];
        }
      );
    }

    setIDs();
    $scope.$watch(function() {
      return angular.toJson($localStorage.url);
    }, function(news, olds) {
      if (news != olds) {
        setIDs()
      };
    });
  });
