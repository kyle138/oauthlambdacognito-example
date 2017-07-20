angular.module("homeApp", [])
.controller("homeCtrl", function($scope, $location) {
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
    if(new Date() > new Date(awstoken.expireTime)) {  // Token is expired, redirect to /login
      console.log("Token Expired");
      $location.url("/login");
    } else {  // Token is current, proceed.
      console.log("Token is still fresh");
      AWS.config.credentials.params.Logins['accounts.google.com'] = "Updated Google id_token";
      AWS.config.credentials.refresh(function(err) {
        if(err) {
          console.log("AWS.config.credentials.refresh Error: "+err);
          return;
        } else {
          console.log("refresh.cognitoIdentityId "+AWS.config.credentials.identityId);
          console.log("refresh.accessKeyId "+AWS.config.credentials.accessKeyId);
          console.log("refresh.secretAccessKey "+AWS.config.credentials.secretAccessKey);
          console.log("refresh.sessionToken "+AWS.config.credentials.sessionToken);
          console.log("refresh.expireTime "+AWS.config.credentials.expireTime);
        }
      });
/*      invokeLambda(null, awstoken, function(res) {
        $scope.$apply(function() {
          $scope.salutations = "Hello "+awstoken.emailAdrs;
          $scope.lambdaReturn = res; // Display numTables
        }); // End scope.apply
      }); // End getTables */
    } // End If Expired
  } // End If !localStorage.awstoken

}); // End app.controller
