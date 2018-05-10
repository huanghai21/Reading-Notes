var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID; // {$oid: req.session.loginId} 的方式已经无法继续使用
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
app.use(function(req, res, next) {
	if(req.session.loginId) {
		res.locals['authenticated'] = true;
		// findOne 返回的是可以直接使用的文档对象
		app.db.collection('users').findOne({_id: ObjectID(req.session.loginId)}, 
			function(err, user) {
				if(err) return next(err);
				res.locals['me'] = user;
				next();
			});
	}else{
		res.locals['authenticated'] = false;
		next();
	}
});

app.set('view engine', 'jade');


app.get('/', function (req, res) {
	res.render('index');
});

app.get('/login', function (req, res) {
	res.render('login');
});
app.get('/logout', function (req, res) {
	req.session.loginId = null
	res.redirect('/');
});

app.get('/login/:email', function (req, res) {
	res.render('login', {signupEmail: req.params.email});
});

app.post('/login', function(req, res) {
	// find 返回的是cursor(游标)，需要使用toArray转换之后才是可以使用的文档对象数组
	app.db.collection('users').find(req.body).toArray(function(err, users) {
	    if(err) return next(err);
	    console.log("Found the following records");
	    console.log(users)
	    let user = users[0];
	    req.session.loginId = user._id.toString();
	    res.redirect('/');
	});
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