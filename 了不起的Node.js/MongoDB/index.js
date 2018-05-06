var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const dbName = 'my-website';

app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); // 读取键值对
app.use(cookieParser());
app.use(session({
	secret: 'my secret',
	resave: false, 
	saveUninitialized: true
}));

app.set('view engine', 'jade');


app.get('/', function (req, res) {
	res.render('index', {authenticated: false});
});

app.get('/login', function (req, res) {
	res.render('login');
});

app.get('/login/:email', function (req, res) {
	res.render('login', {signupEmail: req.params.email});
});

app.get('/signup', function (req, res) {
	res.render('signup');
});
var jsonParser = bodyParser.json();
app.post('/signup', function (req, res, next) {
	insertUser(app.db, req.body, function(result) {
		console.log('result is: ', result);
		res.redirect('/login/' + result[0].email);
		// app.client.close();
	});
});

const insertUser = function(db, item, callback) {
	db.collection('users')
	.insert(item, function(err, result) {
		if (err) throw err;
    	callback(result['ops']);
	});
}

MongoClient.connect(url, function(err, client) {
	if(err) throw err;
	console.log('connected to mongodb');
	app.db = client.db(dbName);
	app.client = client;
	app.listen(3000, function() {
		console.log('app listening on *:3000');
	});
	
});