angular.module('pmreader.controllers')
  .controller('ConfigController', function($stateParams, $scope, $localStorage, Data, Helper, $log, $q, $ionicModal, $rootScope) {
    var vm = this;
    vm.$storage = $localStorage;

    //Create box modal
    $ionicModal.fromTemplateUrl('templates/add-box.html', {
      scope: $scope
    }).then(function(modal) {
      vm.modal = modal;
      if ($stateParams.d) {
        vm.openModal($stateParams.d);
        $stateParams.d = null;
      }
    });
    $scope.createBox = function(u) {
      if (!$localStorage.boxes) {
        $localStorage.boxes = []
      }
      $localStorage.boxes.push(u);
      $localStorage.currentBox = joinBox(u);

      $scope.closeModal();
    };

    function joinBox(box) {
      var b = box.id ? box.id + ":::" : ":::";
      return box.url ? b + box.url : b;
    }

    vm.removeBox = function(box) {
      var selectedJoin = $localStorage.currentBox,
        boxes = $localStorage.boxes,
         removingJoin = joinBox(box);

      for (var i = 0; i < boxes.length; i++) {
        var b = boxes[i];
        if (b.url == box.url && b.id == box.id) {
          $localStorage.boxes.splice(i, 1);
        }
      }
      if (selectedJoin == removingJoin) {
        if (boxes.length > 0) {
          $localStorage.currentBox = joinBox(boxes[0]);
        } else {
          $localStorage.currentBox = null;
        }
      }
    };

    $scope.closeModal = function() {
      vm.modal.hide();
    };
    vm.openModal = function(arg) {
      if (arg) {
        $scope.editedBox = arg;
        $scope.found = true;
      } else {
        $scope.editedBox = {};
        $scope.found = false;
      }
      $scope.state = "";
      $scope.ids = [];
      vm.modal.show();
    };


    var x = $rootScope.$on('boxFound', function(arg, arg2) {
      vm.openModal(arg2);
    });

    $scope.$on('$destroy', function() {
      x();
    });

    //Nasty bit of promise hacking to make the GUI nicely responsive
    function setIDs() {
      if (!$scope.editedBox || !$scope.editedBox.url) {
        return;
      }
      if (vm.canceler) {
        vm.canceler.resolve();
      }
      vm.canceler = $q.defer();
      var old = vm.promise;
      if (old) {
        old.then(function() {
          $scope.state = "loading";
        });
      } else {
        $scope.state = "loading";
      }
      vm.promise = Data.getSensorIds($scope.editedBox.url, vm.canceler).then(
        function(ids) {
          if (old) {
            old.then(function() {
              $scope.state = "ok";
              $scope.ids = ids;
              if ($scope.editedBox.id == null) {
                $scope.editedBox.id = ids[0];
              }
            });
          } else {
            $scope.state = "ok";
            $scope.ids = ids;
            if ($scope.editedBox.id == null) {
              $scope.editedBox.id = ids[0];
            }
          }
        },
        function(r) {
          $scope.state = "error";
          $scope.ids = [];
        }
      );
    }

    setIDs();
    $scope.$watch("editedBox.url", function(news, olds) {
      if (news != olds) {
        setIDs()
      };
    });
  });
