angular.module("oauth2cbApp", [])
.controller("oauth2cbCtrl", function($scope, $http, $window, $location, $timeout) {
  console.log("ctrl start");
  $scope.status = ["Gathering energy..."];
  var code = getUrlVars()["code"];

  // Store user's email adrs and refresh token in Cognito userInfo dataset
  function storeDataset(email, refresh, cb) {
    var syncClient = new AWS.CognitoSyncManager();
    syncClient.openOrCreateDataset('userInfo',function(err, dataset) {
      if(email) {
        dataset.put('email', email, function(err, record) {
          $scope.status.push("Email stored in Dataset...");
          console.log("dataset stored: email");
        });
      }
      if(refresh) {
        dataset.put('google_refresh_token', refresh, function(err,record) {
          $scope.status.push("Refresh token stored in Dataset...");
          console.log("dataset stored: refresh");
        });
      }
      dataset.synchronize({
        onSuccess: function(data, newRecords) {
          $scope.status.push("Local Dataset synchronized with Cognito...");
          console.log("dataset synchronized.");
          if(!refresh) {  // Refresh token wasn't supplied by Googs, try to retrieve from Cognito
            dataset.get('google_refresh_token', function(err, value) {
              if(value) {
                console.log("dataset.get: "+ value);
                storeLocalGoogleRefresh(value, function(err, ret) {
                  if(err) {
                    console.log("dataset.get:storeLocalRefresh error" + err);
                  } else {
                    $scope.$apply(function() {
                      $location.url("/");
                    });
                  }
                }); // End storeLocalRefresh
              } else {
                console.log("dataset.get google_refresh_token error: " + err );
              }
            }); // End dataset.get
          } else {
            $scope.$apply(function() {
              $location.url("/");
            });
          }
        },
        onFailure: function(err) {
          console.log("dataset failure: "+err);
        },
        onConflict: function(data, conflicts, callback) {
          var resolved = [];
          for (var i=0; i<conflicts.length; i++) {
            // Overwrite the remote version with the local version
            console.log("Dataset conflict: overwriting with local version..."); // DEBUG
            resolved.push(conflicts[i].resolveWithLocalRecord());
          }
          dataset.resolve(resolved, function() {
            return callback(true);
          });
        }
      }); //End dataset.synchronize
    }); //End openOrCreateDataset
  }; // End storeDataset

  // Store user's refresh token in localStorage
  function storeLocalGoogleRefresh(refresh, cb) {
    if(!refresh) { //refresh token is required
      if(typeof cb === 'function' && cb("Error: refresh is required.", null));
    } else {
      // Save google_refresh_token in browser localStorage
      localStorage.setItem("google_refresh_token", refresh);
      $scope.status.push("Refresh token stored locally...");
      console.log("Google refresh token set in localStorage: "+refresh);
      if(typeof cb === 'function' && cb(null, true));
    }
  }; // End storeLocalGoogleRefresh

  // Store user's access token in localStorage
  function storeLocalGoogleAccess(access, cb) {
    if(!access) { //access token is required
      if(typeof cb === 'function' && cb("Error: access or access is required.", null));
    } else {
      // Save google_access_token in browser localStorage
      localStorage.setItem("google_access_token", access);
      $scope.status.push("Access token stored locally...");
      console.log("Google access token set in localStorage: "+access);
      if(typeof cb === 'function' && cb(null, true));
    }
  }; // End storeLocalGoogleAccess

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
      console.log("apigGenerateToken response: "+JSON.stringify(response,null,2));  //DEBUG
      if(response.data.admitted == 1) {   // If user logged in using @hartenergy.com account
        console.log("Google id_token: "+response.data.id_token); //DEBUG
        $scope.status.push("Swapping code for token...");
        // Exchange Google token for Cognito ID
        var cognitoParams = {
          IdentityPoolId: configuration.IdentityPoolId,
          Logins: {
            'accounts.google.com': response.data.id_token
          },
          LoginId: response.data.email
        };
        AWS.config.region = 'us-east-1';
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
            "refreshExpire10": (new Date()).getTime()+(1000*60*60*10),
            "emailAdrs": response.data.email
          };
          console.log("awstoken: "+JSON.stringify(awstoken,null,2));  //DEBUG
          $scope.status.push("Swapping token for AWS credentials");
          // Save awstoken in browser localStorage
          localStorage.setItem("awstoken", JSON.stringify(awstoken));
          // Store user's email address and refresh token in Cognito dataset
          if(response.data.refresh_token) { // If refresh_token provided, store separately.
            console.log("Google refresh_token: "+response.data.refresh_token); //DEBUG
            storeLocalGoogleRefresh(response.data.refresh_token);
            storeLocalGoogleAccess(response.data.access_token);
            storeDataset(response.data.email, response.data.refresh_token);
          } else {
            console.log("No refresh, so sad.");
            console.log("Storing email in dataset: "+response.data.email);
            storeLocalGoogleAccess(response.data.access_token);
            storeDataset(response.data.email);
          }
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
