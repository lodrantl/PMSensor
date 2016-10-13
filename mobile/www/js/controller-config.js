angular.module('pmreader.controllers')
  .controller('ConfigController', function($scope, $localStorage) {
    var vm = this;
    vm.$storage = $localStorage;
  });
