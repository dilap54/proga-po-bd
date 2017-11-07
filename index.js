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
		if (err){
			console.error('Ошибка получения данных с базы', err);
			res.end(end);
		}
		else{
			console.log(result);
			res.render('show', {data: result});
		}
	});
});

app.get('/table', function(req, res){
	cadrs.fetchDB((err, result, fields)=>{
		console.log(result);
		var data = {
			title: 'Сотрудники',
			head: {
				fullName:'ФИО',
				birthDay:'Дата рождения',
				gender: 'Пол',
				placeName: 'Должность',
				departName: 'Отдел'
			},
			body: result
		};
		res.render('table', data);
	});
});

app.get('/workers', function(req, res){
	cadrs.fetchWorkers((err, result)=>{
		if (err){
			console.error(err);
			res.status(500).end();
		}
		var data= {
			workers: result
		};
		res.render('workers', data);
	});
});

app.get('/departments', function(req, res){
	cadrs.fetchDepartments((err, result, fields)=>{
		var data = {
			departments: result
		};
		res.render('departments', data);
	});
});

app.listen(18092, function () {
	console.log('Прога по БД заработала.');
});
