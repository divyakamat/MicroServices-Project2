var express = require('express');
var AWS = require('aws-sdk');
var chalk = require ("chalk");
var url = require('url');
var crypto = require('crypto');
var bodyParser = require("body-parser");

var algorithm = 'aes-256-ctr';

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
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
var choosenURL;
app.post('/messages',function(req,res){
  var CID = Math.floor((Math.random() * 100) + 1);
  //console.log(CID);
  if (req.body.OP=="GET"||req.body.OP=="DELETE") {
    choosenURL= GETQUEUE;
  }
  else if (req.body.OP=="POST") {
    choosenURL= POSTQUEUE;	
  }
  else if (req.body.OP=="PUT")
  {
    if (req.body.SchemaChange == "ADD")
    	choosenURL = ADDQUEUE;
    else if (req.body.SchemaChange == "DELETE")
    	choosenURL=DELQUEUE;
    else
    	choosenURL=GETQUEUE;
  }
  //console.log(choosenURL);
  req.body.CID = CID;
  var message2send = JSON.stringify(req.body);
  sqs.sendMessage({
     QueueUrl: choosenURL,
     MessageBody: message2send
    }, function(err,data) {
     // If there are any messages to get
      if (err) 
        return res.status(400).send(err);
      
      else 
     	  return res.status(200).send("YOUR REQ ID IS:"+CID);
    });
});

app.get('/messages/:enckey/',function(req,res){

  var enckey = req.params.enckey;
  var arr = req.url.split("=");
    //console.log(arr[1]);
	var URL = arr[1];
	//console.log(chalk.red(URL));
 sqs.receiveMessage({
   QueueUrl: URL,
   MaxNumberOfMessages: 10, 
   VisibilityTimeout: 1, // seconds - how long we want a lock on this job
   WaitTimeSeconds: 3
 }, function(err, data) {
   // If there are any messages to get
   if(err)
    console.log(err.message);
   else if (data.Messages) {
      // Get the first message (should be the only one since we said to only get one above)
      	var response = [];
		for (var i =0; i<data.Messages.length;i++)
		{ 
	        var message = data.Messages[i];
          var result = decrypt(message.Body, enckey);
          try {
            JSON.parse(result);
          } catch (e) {
            res.status(404).send("Encryption key invalid");
            return;
          }
	        body = JSON.parse(result);

	        console.log("we reached here");
	        response.push(body);
	        removeFromQueue(message,URL);
		}
		//console.log(response);
		res.status(200).send(response);
}
	else
		res.status(404).send("Message queue empty");
});
});

 var removeFromQueue = function(message,url) {
   sqs.deleteMessage({
      QueueUrl: url,
      ReceiptHandle: message.ReceiptHandle
   }, function(err, data) {
      // If we errored, tell us that we did
      err && console.log(err);
   });
};

function decrypt(text,password){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}


app.listen(3000, function(){
	console.log('Started student Express server on port 3000!');
});