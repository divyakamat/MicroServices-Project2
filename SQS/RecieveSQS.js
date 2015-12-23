var AWS = require('aws-sdk');
var request = require('request');
var chalk = require ("chalk");
var sqs = new AWS.SQS({
region: "us-east-1",
});

    var GETQUEUE = 'https://sqs.us-east-1.amazonaws.com/476005042879/GET';
    var POSTQUEUE = 'https://sqs.us-east-1.amazonaws.com/476005042879/POST';
    var ADDQUEUE = 'https://sqs.us-east-1.amazonaws.com/476005042879/ADD';
    var DELQUEUE = 'https://sqs.us-east-1.amazonaws.com/476005042879/DELETE';
    var RESQUEUE = 'https://sqs.us-east-1.amazonaws.com/476005042879/RESPONSE';
    var RESPONSEOMAR ="https://sqs.us-east-1.amazonaws.com/476005042879/RESPONSEOMAR";
    var RESPONSEDIVYA ="https://sqs.us-east-1.amazonaws.com/476005042879/RESPONSEDIVYA";


var GETURL = "http://localhost:3001/students/";
var POSTURL = "http://localhost:3001/students/";
var ADDURL = "http://localhost:3001/students/updateSchema/addNewField";
var DELURL = "http://localhost:3001/students/updateSchema/deleteField";

var URLS = [GETURL,POSTURL,ADDURL,DELURL];
var priority = [4,3,1,1];
var names = [GETQUEUE,POSTQUEUE,ADDQUEUE,DELQUEUE];
var counter = 0;

var algorithm = 'aes-256-ctr';

(function receivemessages(){
  sqs.receiveMessage({
   QueueUrl: names[counter],
   MaxNumberOfMessages: 1, 
   VisibilityTimeout: 60, // seconds - how long we want a lock on this job
   WaitTimeSeconds: priority[counter] // seconds - how long should we wait for a message?
 }, function(err, data) {
   // If there are any messages to get
   if(err)
    console.log(err.message);
   else if (data.Messages) {
      // Get the first message (should be the only one since we said to only get one above)
      var message = data.Messages[0];
        body = JSON.parse(message.Body);

        request({
            url: URLS[counter]+ body.SID, //URL to hit
            method: body.OP, //Specify the method 
            body: JSON.stringify(body.Message),  
            headers: {"content-type":"application/json"}    
        }, function(error, response, body1){
            if(error) 
               sendmessage(error.message,body.CID,body.ResQueue,body.EncKey); 
            
            else
              sendmessage(response.body,body.CID,body.ResQueue,body.EncKey);  
        });
     removeFromQueue(message);
 
   }
   counter = (counter + 1) % 4;
  receivemessages();
 });
 
})();
 

var removeFromQueue = function(message) {
   sqs.deleteMessage({
      QueueUrl: names[counter],
      ReceiptHandle: message.ReceiptHandle
   }, function(err, data) {
      // If we errored, tell us that we did
      err && console.log(err);
   });
};


var sendmessage = function(data,CID,resqueue,enckey){

var resmessage = {
 "reponse" : data,
 "CID": CID
};
console.log(resmessage);
message = JSON.stringify(resmessage);
message = encrypt(message,enckey);

sqs.sendMessage({
   QueueUrl:resqueue ,
   MessageBody: message 
 }, function(err,data) {

  if (err)
    console.log(chalk.red(err.message));

 });
};

function encrypt(text,password){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
