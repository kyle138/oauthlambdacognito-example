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
      AWS.config.credentials.params.Logins['accounts.google.com'] = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1MTA3MjBjZDUyNDJiMzI4MTdiZDhjMjFkNTM3Mzg4ZWE5MGE1Y2UifQ.eyJhenAiOiI2NjIyOTM3MjMzMzktcXRjbzUzY3JyMTRzbGZybnZnZzBrbHY1YmRobmxkbDQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI2NjIyOTM3MjMzMzktcXRjbzUzY3JyMTRzbGZybnZnZzBrbHY1YmRobmxkbDQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDIyNTc1MjQzMzU4ODY5NDc1MDYiLCJoZCI6ImhhcnRlbmVyZ3kuY29tIiwiZW1haWwiOiJrbXVuekBoYXJ0ZW5lcmd5LmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoicWtRWXAtOEtVN25mbnh2RlR3NjhDZyIsImlzcyI6ImFjY291bnRzLmdvb2dsZS5jb20iLCJpYXQiOjE1MDA1NzYzMDksImV4cCI6MTUwMDU3OTkwOX0.R4aFBfvPRcKYH_l9LXXHCR-owGKymH8Qnc6yL513h4AtYBK0w8OBqLZK_OJae4AlBh_dSvurTuu7qczq7JO91kRIiAePkqzNQ3-FLgnYHbOIYwyAnZuSVU4D3_ibXfOwNGdKDprFqY81C1ExT1zo43XziIl-nZSAo6nt0-ZoOZhWbG5S9bjQ8DMn1PVGm8VINYd30psYaYJvtmepV3K5T-pkQx7Bt0UMyivNGyiQx8WvxLR5QqwIWr5BHynes7lGA8CCBl1agEGjOczdYJvXirpEIfwJGgnvj-NNCUZPmf0Fzxm5SYsJHY0woI9eRb3W1mBfpl0aczg5U0c802FpmQ";
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

      //$location.url("/login");
    } else {  // Token is current, proceed.
      console.log("Token is still fresh");
      if(!AWS.config.credentials) {
        console.log("Creating AWS.config.credentials");
        var cognitoParams = {
          IdentityPoolId: configuration.IdentityPoolId,
          Logins: {
            'accounts.google.com': "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1MTA3MjBjZDUyNDJiMzI4MTdiZDhjMjFkNTM3Mzg4ZWE5MGE1Y2UifQ.eyJhenAiOiI2NjIyOTM3MjMzMzktcXRjbzUzY3JyMTRzbGZybnZnZzBrbHY1YmRobmxkbDQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI2NjIyOTM3MjMzMzktcXRjbzUzY3JyMTRzbGZybnZnZzBrbHY1YmRobmxkbDQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDIyNTc1MjQzMzU4ODY5NDc1MDYiLCJoZCI6ImhhcnRlbmVyZ3kuY29tIiwiZW1haWwiOiJrbXVuekBoYXJ0ZW5lcmd5LmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoicWtRWXAtOEtVN25mbnh2RlR3NjhDZyIsImlzcyI6ImFjY291bnRzLmdvb2dsZS5jb20iLCJpYXQiOjE1MDA1NzYzMDksImV4cCI6MTUwMDU3OTkwOX0.R4aFBfvPRcKYH_l9LXXHCR-owGKymH8Qnc6yL513h4AtYBK0w8OBqLZK_OJae4AlBh_dSvurTuu7qczq7JO91kRIiAePkqzNQ3-FLgnYHbOIYwyAnZuSVU4D3_ibXfOwNGdKDprFqY81C1ExT1zo43XziIl-nZSAo6nt0-ZoOZhWbG5S9bjQ8DMn1PVGm8VINYd30psYaYJvtmepV3K5T-pkQx7Bt0UMyivNGyiQx8WvxLR5QqwIWr5BHynes7lGA8CCBl1agEGjOczdYJvXirpEIfwJGgnvj-NNCUZPmf0Fzxm5SYsJHY0woI9eRb3W1mBfpl0aczg5U0c802FpmQ"
          },
          LoginId: "kmunz@hartenergy.com"
        };
        AWS.config.region = 'us-east-1';
        AWS.config.credentials = new AWS.CognitoIdentityCredentials(cognitoParams);
      }
      AWS.config.credentials.params.Logins['accounts.google.com'] = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1MTA3MjBjZDUyNDJiMzI4MTdiZDhjMjFkNTM3Mzg4ZWE5MGE1Y2UifQ.eyJhenAiOiI2NjIyOTM3MjMzMzktcXRjbzUzY3JyMTRzbGZybnZnZzBrbHY1YmRobmxkbDQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI2NjIyOTM3MjMzMzktcXRjbzUzY3JyMTRzbGZybnZnZzBrbHY1YmRobmxkbDQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDIyNTc1MjQzMzU4ODY5NDc1MDYiLCJoZCI6ImhhcnRlbmVyZ3kuY29tIiwiZW1haWwiOiJrbXVuekBoYXJ0ZW5lcmd5LmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoicWtRWXAtOEtVN25mbnh2RlR3NjhDZyIsImlzcyI6ImFjY291bnRzLmdvb2dsZS5jb20iLCJpYXQiOjE1MDA1NzYzMDksImV4cCI6MTUwMDU3OTkwOX0.R4aFBfvPRcKYH_l9LXXHCR-owGKymH8Qnc6yL513h4AtYBK0w8OBqLZK_OJae4AlBh_dSvurTuu7qczq7JO91kRIiAePkqzNQ3-FLgnYHbOIYwyAnZuSVU4D3_ibXfOwNGdKDprFqY81C1ExT1zo43XziIl-nZSAo6nt0-ZoOZhWbG5S9bjQ8DMn1PVGm8VINYd30psYaYJvtmepV3K5T-pkQx7Bt0UMyivNGyiQx8WvxLR5QqwIWr5BHynes7lGA8CCBl1agEGjOczdYJvXirpEIfwJGgnvj-NNCUZPmf0Fzxm5SYsJHY0woI9eRb3W1mBfpl0aczg5U0c802FpmQ";
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
