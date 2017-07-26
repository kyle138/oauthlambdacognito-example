angular.module("homeApp", [])
.controller("homeCtrl", function($scope, $http, $location) {
  console.log("homeCtrl started");  //DEBUG

  //Default values
  $scope.salutations = "Waiting on Lambdas...please stand by";
  $scope.numTables = "¯\\_(ツ)_/¯";

  // Displays errors
  function showError(response) {
    if (response instanceof Error) {
      console.log('Error', response.message);
    } else {
      console.log(response.data);
      console.log(response.status);
      console.log(response.headers);
      console.log(response.config);
    }
  };  // End showError

  // Wrapper for IAM protected API Gateway call to get number of Tables
  // The API Gateway endpoints are specified in the apigClient.js file
  function invokeLambda(err, token, cb) {
    var options = {
      accessKey: token.accessKeyId,
      secretKey: token.secretAccessKey,
      sessionToken: token.sessionToken,
      region: configuration.awsRegion
    };
    var apigClient = apigClientFactory.newClient(options);
    var body = {
      "weR": 138  // This is just nonsense, nothing is listening
    };
/*    apigClient.sampleGet({},body)
     .then(function(response) {
       console.log("sampleGet: "+JSON.stringify(response,null,2));  //DEBUG
       cb(response.data);
     }).catch(function(response) {
       alert('sampleGet failed');
       showError(response);
     }); */
  };  // End getTables

  function requestRefreshToken(cb) {
    if(!localStorage["google_refresh_token"]) {  // google_refresh_token missing
      console.log("Unable to refresh without google_refresh_token, logging out");
      $location.url("/login");
    } else {
      console.log("localStorage.google_refresh_token found...");  // DEBUG
      if(!localStorage["google_access_token"]) {  // google_access_token missing
        console.log("Unable to refresh without google_access_token, logging out");
        $location.url("/login");
      } else {
        console.log("localStorage.google_access_token found..."); // DEBUG
        console.log("Requesting refresh token...");
        $http.get(  // Query API gateway for refreshToken
          configuration.apigRefreshToken,
          {
            params:  {
                refreshToken: localStorage.getItem('google_refresh_token'),
                accessToken: localStorage.getItem('google_access_token')
            }
          }
        ).then(function(response) {
          if(response.data.errorMessage) {
            console.log("Refresh request unsuccessful, logging out.");
            console.log("response.data.errorMessage: "+response.data.errorMessage);
            $location.url("/login");
          } else {
            if(!AWS.config.credentials) {
              console.log("Creating AWS.config.credentials");
              var cognitoParams = {
                IdentityPoolId: configuration.IdentityPoolId,
                Logins: {
                  'accounts.google.com': response.data.id_token
                },
                LoginId: awstoken.emailAdrs
              };
              AWS.config.region = 'us-east-1';
              AWS.config.credentials = new AWS.CognitoIdentityCredentials(cognitoParams);
            }
            AWS.config.credentials.refresh(function(err) {
              if(err) {
                console.log("AWS.config.credentials.refresh Error: "+err);
                $location.url("/login");
              } else {
                console.log("refresh.cognitoIdentityId "+AWS.config.credentials.identityId);
                console.log("refresh.accessKeyId "+AWS.config.credentials.accessKeyId);
                console.log("refresh.secretAccessKey "+AWS.config.credentials.secretAccessKey);
                console.log("refresh.sessionToken "+AWS.config.credentials.sessionToken);
                console.log("refresh.expireTime "+AWS.config.credentials.expireTime);
                awstoken.cognitoIdentityId = {'S': AWS.config.credentials.identityId};
                awstoken.accessKeyId = {'S': AWS.config.credentials.accessKeyId};
                awstoken.secretAccessKey = {'S': AWS.config.credentials.secretAccessKey};
                awstoken.sessionToken = {'S': AWS.config.credentials.sessionToken};
                awstoken.expireTime = {'S': AWS.config.credentials.expireTime};
              }
            }); // End AWS.config.credentials.refresh()
          } // If..Else errorMessage from apigRefreshToken
        }); // End http.get refreshToken
      } // end if(google_access_token)
    } // end if(google_refresh_token)
  }; // End requestRefreshToken

  // 'tis the logout button
  $scope.logout = function() {
    localStorage.removeItem('awstoken');
    $location.url("/login");
  }; // End scope.logout

  // Check if user is logged in with a current session, if not redirect to /login
  if(!localStorage.awstoken) {  // No token found
    console.log("No token found");  //DEBUG
    $location.url("/login");
  } else {  // Retreive awstoken and check if expired
    var awstoken = JSON.parse(localStorage.getItem('awstoken'));
    var rightNow = new Date();
    // If awstoken is after expireTime but before refreshExpire10, attempt to refresh
    if(rightNow > new Date(awstoken.expireTime)) {
      if(rightNow < new Date(awstoken.refreshExpire10)) {
        console.log("Token Expired, attempting to refresh.");
        requestRefreshToken();
      } else {
        console.log("Token Expired, refresh attempts expired.");
        localStorage.removeItem('awstoken');
        $location.url("/login");
      }
    } else {  // Token is current, proceed.
      console.log("Token is still fresh");
      requestRefreshToken();
/*      invokeLambda(null, awstoken, function(res) {
        $scope.$apply(function() {
          $scope.salutations = "Hello "+awstoken.emailAdrs;
          $scope.lambdaReturn = res; // Display numTables
        }); // End scope.apply
      }); // End getTables */
    } // End If Expired
  } // End If !localStorage.awstoken

}); // End app.controller
