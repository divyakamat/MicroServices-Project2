var AWS = require("aws-sdk");
var express = require('express');
var bodyParser = require("body-parser");
var fs = require('fs');
var data = fs.readFileSync('schema.json', {encoding: 'utf8'});
var schemaJson = JSON.parse(data);
AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();

/*var NRP = require('node-redis-pubsub');

   config = { port: 11150       // Port of your remote Redis server
             , host: 'tarpon.redistogo.com' // Redis server host, defaults to 127.0.0.1
             , auth: '417cedf12308d728ee483583df87afc0' // Password
             , scope: 'demo'    // Use a scope to prevent two NRPs from sharing messages
             }
  , nrp = new NRP(config); 
  */     // This is the NRP client
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));


app.post('/students',function(req,res){
 
 var studentJson = {};
  studentJson["SSN"] = req.body.SSN;
  for(var key in schemaJson ) {
    if(schemaJson.hasOwnProperty(key)) {
      if(req.body.hasOwnProperty(key))
        studentJson[key] = req.body[key];
      else
        return res.status(400).send('Mandatory fields missing:'+ key);       
    }
  }
   var params = {
     TableName : "Students",
     Item : studentJson,
     ConditionExpression: "attribute_not_exists(SSN)",
     ReturnValues: "ALL_OLD"
   };

dynamodbDoc.put(params, function(err, data) {
       if (err) {
           res.status(500).send(err.message);           
       } else {
           res.status(200).send(data);
      }
    });
}); 

app.get('/students/:SSN', function(req,res){
  var SSN = req.params.SSN;
  var params = {
    TableName : "Students",
    Key: {'SSN' : SSN}
  };
  dynamodbDoc.get(params, function(err, student) {
      if (err) {
          res.status(500).send(err.message);
      } else {
          if(Object.keys(student).length)
            res.status(200).send(student);
          else
            res.status(404).send('Student not found:' + SSN);
      }
  });
});

app.put('/students/:SSN',function(req,res) {
  var keys = [];
  for(key in req.body) { 
   keys.push(key);
  }
  if(key.length==0)
    res.status(500).send('Nothing to Update');
    return;

  var updateexpressioninit = "SET list[0] =:val0,";
 // var attributevaluesinit = "':val1':req.body[keys][0]";

  for(var i in keys){
   updateexpressionfinal 

  }

  var params = {
    TableName : "Students",
    Key: {'SSN' : req.params.SSN},
    UpdateExpression: ,
    ExpressionAttributeNames:{"key":keys[i]},
    ExpressionAttributeValues:{":updated":req.body[keys][i]},
    ReturnValues:"UPDATED_NEW"
  };

  dynamodbDoc.update(params, function(err, updatedstudent) {
      if (err) {
          res.status(500).send(err.message);
      } else {
          res.status(200).send(updatedstudent);
      }
  });
});

//app.delete('/students/:SSN', function(req,red)
app.listen(3001, function(){
	console.log('Started student Express server on port 3001!');
});
