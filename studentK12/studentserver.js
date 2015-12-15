var AWS = require('aws-sdk');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));

AWS.config.update({
	region: "us-east-1",
	endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var dynamodb = new AWS.DynamoDB();
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();

var data = fs.readFileSync('studentschema.json', {encoding: 'utf8'});
var schema = JSON.parse(data);

app.get('/students/:SSN', function(req,res){
	var ssn = req.params.SSN;

	var params = {
		TableName : "StudentK12",
		Key: {
			'SSN' : ssn
		}
	};

	dynamodbDoc.get(params, function(err, data) {
	    if (err) {
	        //console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
	        res.status(500).send(err.message);
	    } else {
	        console.log("Query succeeded.");
	        if(Object.keys(data).length)
	        	res.status(200).send(data);
	        else
	        	res.status(404).send('Student not found');
	    }
	});
});

app.put('/students/:SSN',function(req,res) {
	var key;
	for(key1 in req.body) {
		console.log(key1);
		key = key1;
		break;
	}
	console.log(key);
	if(!key)
		res.status(500).send('keys missing')
	var params = {
		TableName : "StudentK12",
		Key: {
			'SSN' : req.params.SSN
		},
		UpdateExpression: "set #key = :val",
		ExpressionAttributeNames:{"#key":key},
	    ExpressionAttributeValues:{
	        ":val":req.body[key]
	    }
	};

	dynamodbDoc.update(params, function(err, data) {
	    if (err) {
	        //console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
	        res.status(500).send(err.message);
	    } else {
	        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
	        res.status(200).send("Update successfull");
	    }
	});
});

app.post('/students',function(req,res){
	console.log('hello');
	var studentJson = {};
	studentJson["SSN"] = req.body.SSN;
	for(var key in schema) {
		if(schema.hasOwnProperty(key)) {
			if(req.body.hasOwnProperty(key))
				studentJson[key] = req.body[key];
			else
				return res.status(400).send('Mandatory fields missing!');				
		}
	}
	var params = {
		TableName : 'StudentK12',
		Item: studentJson
	};

	console.log('hello');

	dynamodbDoc.put(params, function(err, data) {
       if (err) {
           //console.error("Unable to add movie", movie.title, ". Error JSON:", JSON.stringify(err, null, 2));
           res.status(500).send(err.message);           
       } else {
           //console.log("PutItem succeeded:", movie.title);
           res.status(200).send(data);
       }
    });
});

app.delete('/students/:SSN', function(req, res){
	var params = {
		TableName : "StudentK12",
		Key: {
			'SSN' : req.params.SSN
		}
	};

	dynamodbDoc.delete(params, function(err, data) {
	    if (err) {
	        //console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
	        res.status(500).send(err.message);
	    } else {
	        //console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
	        res.status(200).send('Student deleted');
	    }
	});
});

app.listen(3000, function(){
	console.log('Started student Express server on port 3000!');
});