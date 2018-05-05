var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongodb = require('mongodb');

app = express();

app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
	secret: 'my secret',
	resave: false, 
	saveUninitialized: true
}));

app.set('view engine', 'jade');
// app.set('view options', {layout: false});

app.get('/', function (req, res) {
	res.render('index', {authenticated: false});
});

app.get('/login', function (req, res) {
	res.render('login');
});

app.get('/signup', function (req, res) {
	res.render('signup');
});

app.listen(3000);