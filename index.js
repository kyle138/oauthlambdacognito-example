var windowThatWasOpened;

var dop = angular.module("dopApp", [
  "ngRoute",
  "homeApp",
  "loginApp",
  "oauth2cbApp"
])
.config( function($routeProvider) {
  $routeProvider
  .when("/", {
    templateUrl : "home/home.html",
    controller : "homeCtrl",
    pageTitle : "Home",
  })
  .when("/login", {
    templateUrl : "login/login.html",
    controller : "loginCtrl",
    pageTitle : "Login"
  })
  .when("/oauth2cb", {
    templateUrl : "oauth2cb/oauth2cb.html",
    controller : "oauth2cbCtrl",
    pageTitle : "Callback"
  });
});
