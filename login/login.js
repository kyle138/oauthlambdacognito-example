angular.module("loginApp", [])
.controller("loginCtrl", function($scope, $http, $window) {

  var url;
  $scope.authReady = false;

  // Retrieve AuthUrl for Google login button, do not display button until ready.
  $http.get(configuration.apigGenerateAuthUrl)
  .then(function(response) {
    url = response.data;
    console.log("Login url: "+url); //DEBUG
    $scope.authReady = true;
  });

  // Google login button opens new window to handle oauth acceptance and callback
  $scope.login = function() {
    console.log("[Login]"); //DEBUG
    window.location = url;
    };
});
