var AWS = require('aws-sdk');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');

AWS.config.update({
	endpoint: "https://dynamodb.us-west-2.amazonaws.com"
});

var dynamodb = new AWS.DynamoDB();
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();

var data = fs.readFileSync('studentschema.json', {encoding: 'utf8'});
var schema = JSON.parse(data);

app.get('/students/:SSN', function(req,res){
	var ssn = req.params.SSN;

	var params = {
		TableName : "studentMS",
		Key: {
			'ssn' : ssn
		};
	};

	dynamodbDoc.get(params, function(err, data) {
	    if (err) {
	        //console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
	        res.status(500).send(err.message);
	    } else {
	        console.log("Query succeeded.");
	        if(data)
	        	res.status(200).send(data);
	        else
	        	res.status(404).send('Student not found');
	    }
	});
});

app.put('/students/:SSN',function(req,res) {
	var key;
	for(key in req.body)
		break;
	if(!key)
		res.status(500).('keys missing')
	var params = {
		TableName : "studentMS",
		Key: {
			'ssn' : req.params.SSN;
		},
		UpdateExpression: "set #key = :val",
		ExpressionAttributeNames:{"#key":key},
	    ExpressionAttributeValues:{
	        ":val":req.body.key
	    }
	};

	dynamodbDoc.update(params, function(err, data) {
	    if (err) {
	        //console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
	        res.status(500).send(err.message);
	    } else {
	        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
	        res.status(200).send(data);
	    }
	});
});

app.push('/students',function(req,res){
	var params = {
		TableName : 'studentMS',
		Item: req.body
	};

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

app.delete('/students/:SSN', function(err, data){
	var params = {
		TableName : "studentMS",
		Key: {
			'ssn' : ssn
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