angular.module("oauth2cbApp", [])
.controller("oauth2cbCtrl", function($scope, $http, $window, $location, $timeout) {

  $scope.status = ["Gathering energy..."];
  var code = getUrlVars()["code"];

  // Store user's email adrs in Cognito userInfo dataset
  function storeDataset(err, email, cb) {
    var syncClient = new AWS.CognitoSyncManager();
    syncClient.openOrCreateDataset('userInfo',function(err, dataset) {
      dataset.put('email', email, function(err, record) {
        dataset.synchronize({
          onSuccess: function(data, newRecords) {
            $scope.status.push("Dataset stored...");
            console.log("dataset stored");
            $scope.$apply(function() {
              $location.url("/");
            });
          },
          onFailure: function(err) {
            console.log("dataset failure: "+err);
          }
        }); //End dataset.synchronize
      }); //End dataset.put
    }); //End openOrCreateDataset
  }; // End storeDataset

  // Return GET variables from URL
  function getUrlVars() {
    var vars = [];
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
      vars[key] = decodeURIComponent(value);
    });
    console.log("getUrlVars::vars[code]: "+vars["code"]); //DEBUG
    $scope.status.push("Code extracted...");
    return vars;
  }; // End getUrlVars

  function storeRefresh(refresh, cb) {
    if(!refresh) { //refresh token is required
      if(typeof cb === 'function' && cb("Error: refresh is required.", null));
    } else {
      // Save google_refresh_token in browser localStorage
      localStorage.setItem("google_refresh_token", JSON.stringify(refresh));
      $scope.status.push("Refresh token stored...");
      if(typeof cb === 'function' && cb(null, true));
    }
  }; // End storeRefresh

  if(!code) { //If we do not have a code, redirect to login/
    console.log("No code");
    $scope.status.push("Oops, you do not have a code!");
    $timeout(function() {
      $location.url("/login");
    });
  } else {
    console.log("Code: "+code); //DEBUG
    $http.get(    // Query API gateway to exchange code for Google tokens
      configuration.apigGenerateToken,
      {params: {code: code}}
    ).then(function(response) {
      if(response.data.admitted == 1) {   // If user logged in using @hartenergy.com account
        if(response.data.refresh_token) { // If refresh_token provided, store separately.
          storeRefresh(response.data.refresh_token);
        }
        console.log("Google id_token: "+response.data.id_token); //DEBUG
        console.log("Google refresh_token: "+localStorage.google_refresh_token); //DEBUG
        $scope.status.push("Swapping code for token...");
        // Exchange Google token for Cognito ID
        var cognitoParams = {
          IdentityPoolId: configuration.IdentityPoolId,
          Logins: {
            'accounts.google.com': response.data.id_token
          },
          LoginId: response.data.email
        };
        AWS.config.region = configuration.awsRegion;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials(cognitoParams);
        AWS.config.credentials.get(function(err) {
          if(err) {
            console.log(("AWS.config.credentials.get Error: "+err));
            return;
          }
          // Store AWS items in awstoken object
          var awstoken = {
            "cognitoIdentityId": AWS.config.credentials.identityId,
            "accessKeyId": AWS.config.credentials.accessKeyId,
            "secretAccessKey": AWS.config.credentials.secretAccessKey,
            "sessionToken": AWS.config.credentials.sessionToken,
            "expireTime": AWS.config.credentials.expireTime,
            "emailAdrs": response.data.email
          };
          console.log("awstoken: "+JSON.stringify(awstoken,null,2));  //DEBUG
          $scope.status.push("Swapping token for AWS credentials");
          // Save awstoken in browser localStorage
          localStorage.setItem("awstoken", JSON.stringify(awstoken));
          // Store user's email address in Cognito dataset
          storeDataset(null, response.data.email);
        }); //End AWS.config.credentials.get()
      } else {  // Not a @hartenergy.com google account
        console.log("generatetoken error: ",JSON.stringify(response,2,null));
        $scope.status.push("This simply will not do.")
        alert(response.data.errorMessage);
        $location.url("/login");
      } //End if admitted
    }); //End http.get generatetoken
  } //End If !code

}); //End controller
