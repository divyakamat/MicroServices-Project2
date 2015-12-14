var AWS = require('aws-sdk');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');

AWS.config.update({endpoint: "https://dynamodb.us-west-2.amazonaws.com"});

var dynamodb = new AWS.DynamoDB();

var data = fs.readFileSync('studentschema.json', {encoding: 'utf8'});
var params = JSON.parse(data);

