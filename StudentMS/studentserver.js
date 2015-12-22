var AWS = require("aws-sdk");
var express = require('express');
var bodyParser = require("body-parser");
var fs = require('fs');
var data = fs.readFileSync('schema.json', {encoding: 'utf8'});
var schemaJson = JSON.parse(data);
var chalk = require ("chalk");
AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var tableName = "Students";
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();

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
     TableName : tableName,
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
    TableName : tableName,
    Key: {'SSN' : SSN}
  };
  console.log (req.body);
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
  var count = 0;
  for(key in req.body) { 
    keys.push(key);
    count++;
    }
  if(key.length==0) {
    res.status(500).send('Nothing to Update');
    return;
  }
  var updateexpression = "set ";

  var j = 0;
  var attributeVal = {};
  var attributeName = {};
  for(var i in keys){
    var value = ":val" + j ;
    var key = "#key" + j;
    if(j < count - 1)
      updateexpression = updateexpression + key + "=" + value +", ";
    else
      updateexpression = updateexpression + key + "=" + value;

    attributeName[key] = keys[i];
    attributeVal[value] = req.body[keys[i]];
    j++;
  }

  var params = {
    TableName : tableName,
    Key: {'SSN' : req.params.SSN},
    UpdateExpression: updateexpression,
    ExpressionAttributeNames: attributeName,
    ExpressionAttributeValues: attributeVal,
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

app.put('/students/updateSchema/addNewField', function(req,res) {

  for (var key in req.body) {
    if (schemaJson.hasOwnProperty(key))
      return res.status(400).send('Field already exists: ' + key);  
  }
   var newkey;
  for (var key in req.body) {
    newkey = key;
    schemaJson[key] = req.body[key];
  }

  fs.writeFileSync('schema.json', JSON.stringify(schemaJson));
  
var params = {
    TableName : tableName,
     ProjectionExpression: 'SSN'
  };

var studentssns;
  dynamodbDoc.scan(params, onScan);

function onScan(err, data)
   {
      if (err) {
        console.log("errored");
          res.status(500).send(err.message);
      }
       else {
          studentssns = data;
           for (var i =0 ; i<studentssns.Count; i++)
            {

              var params = {
              TableName : tableName,
              Key: {'SSN' : studentssns.Items[i].SSN},
              UpdateExpression: "set #key =:val" ,
              ExpressionAttributeNames: {"#key": newkey} ,
              ExpressionAttributeValues:{ ":val":"Not Provided"}, 
            };

            dynamodbDoc.update(params, function(err, updatedstudent) {
            });

            }
        return res.status(200).send("SchemeUpdated added field" + newkey); 
      }
  }
     
});

app.put('/students/updateSchema/deleteField', function(req,res) {

 for (var key in req.body) {
    if (!schemaJson.hasOwnProperty(key))
      return res.status(400).send('Field Does not Exist: ' + key);
  }
   var newkey;
  for (var key in req.body) {
    newkey = key;
    delete schemaJson[key];
  }

  fs.writeFileSync('schema.json', JSON.stringify(schemaJson));

var params = {
    TableName : tableName,
    ProjectionExpression: 'SSN'
  };

var studentssns;
  dynamodbDoc.scan(params, onScan);

function onScan(err, data)
   {
      if (err) {
        console.log("errored");
          res.status(500).send(err.message);
      }
       else {
          studentssns = data;
           for (var i =0 ; i<studentssns.Count; i++)
            {

              var params = {
              TableName : tableName,
              Key: {'SSN' : studentssns.Items[i].SSN},
              UpdateExpression: "remove #key" ,
              ExpressionAttributeNames: {"#key": newkey} ,
            };

            dynamodbDoc.update(params, function(err, updatedstudent) {
            });

            }
        return res.status(200).send("SchemeUpdated removed field: " + newkey); 
      }
  } 

});
app.delete('/students/:SSN', function(req, res){    
 var params = {    
   TableName : tableName,   
   Key: {'SSN' : req.params.SSN }   
 };    
   
 dynamodbDoc.delete(params, function(err, data) {    
    if (err) {       
         res.status(500).send(err.message);    
     } else {    
   
    res.status(200).send('Student deleted');    
    }   
});   
});

app.listen(3001, function(){
	console.log('Started student Express server on port 3001!');
});
