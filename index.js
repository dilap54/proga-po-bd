const express = require('express');
const app = express();
const pool = require('./db.js');
const cadrs = require('./cadrs.js');
const generator = require('./generator.js');

app.set('view engine', 'pug');

app.use(express.static('public'));
app.use((req, res,next)=>{
	res.header("Content-Type", "text/html; charset=utf-8");
	next();
});


app.get('/', function (req, res) {
	res.render('index');
});

app.get('/createDB', function(req, res){ //TODO: заменить на POST
	cadrs.createDB(function(err, result){
		console.log(err, result);
		res.end(err+result);
	});
});

app.get('/dropDB', function(req, res){ //TODO: заменить на POST
	cadrs.dropDB(function(err, result){
		console.log(err, result);
		res.end(err+result);
	});
});

app.get('/generateDB', function(req, res){ //TODO: заменить на POST
	cadrs.generateDB(function(err, result){
		console.log(err, result);
		res.end(err+result);
	});
});

app.get('/show', function(req, res){
	cadrs.fetchDB((err, result)=>{
		console.log(result);
		res.render('show', {data: result});
	});
});


app.get('/generateData', function(req,res){
	generator.generateWorkers(14*7*3, function(err, data){
		console.log(err, data);
		res.end(err+JSON.stringify(data));
	})
});

app.get('/departments', function(req, res){
	generator.GeneratorBD((err, generatordb)=>{
		res.end(err+JSON.stringify(generatordb.getDepartments()));
	})
});

app.get('/workplaces', function(req, res){
	generator.GeneratorBD((err, generatordb)=>{
		res.end(err+JSON.stringify(generatordb.getWorkplaces()));
	})
});

app.listen(18092, function () {
	console.log('Прога по БД заработала.');
});
