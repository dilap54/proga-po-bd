const express = require('express');
const app = express();
const pool = require('./db.js');
const cadrs = require('./cadrs.js');
const generator = require('./generator.js');

app.set('view engine', 'pug');

//app.use(express.bodyParser());
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
		if (err){
			console.error(err);
			res.status(500).end();
		}
		else{
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
		}
	});
});

app.get('/workers', function(req, res){
	cadrs.fetchWorkers((err, result)=>{
		if (err){
			console.error(err);
			res.status(500).end();
		}
		else{
			var data= {
				workers: result, 
				error: err
			};
			res.render('workers', data);
		}
	});
});

app.get('/departments', function(req, res){
	cadrs.fetchDepartments((err, result)=>{
		if (err){
			console.error(err);
			res.status(500).end();
		}
		else{
			var data = {
				departments: result,
			};
			res.render('departments', data);
		}
	});
});

app.get('/departments/new', (req, res)=>{
	if (req.query.name){
		cadrs.addDepartment({name: req.query.name}, (err, result)=>{
			if (err){
				console.error(err);
				res.redirect('/departments?error');
			}
			else{
				res.redirect('/departments');
			}
		})
	}
	else{
		res.redirect('/departments?error');
	}
});

app.get('/departments/(:id)', (req,res)=>{
	cadrs.updateDepartment({
		departmentId: req.params.id,
		abolished: req.query.abolished, 
		name: req.query.name
	}, (err)=>{
		if (err){
			console.error(err);
			res.redirect('/departments?error');
		}
		else{
			res.redirect('/departments');
		}
	})
});

app.get('/positions', (req, res)=>{
	cadrs.fetchPositions((err, result)=>{
		if (err){
			console.error(err);
			res.status(500).end();
		}
		else{
			var data = {
				positions: result,
			};
			res.render('positions', data);
		}
	});
})

app.get('/position', (req, res)=>{
	res.render('position');
});

app.get('/position/(:id)', (req, res)=>{
	cadrs.getPosition(req.params.id, (err, result)=>{
		if (err){
			console.error(err);
			res.status(500).end();
		}
		else if (result.length>0){
			var data = {
				position: result[0]
			};
			res.render('position', data);
		} else{
			res.redirect('/position');
		}
	});
});
app.get('/postposition', (req, res)=>{
	cadrs.setPosition({
		name: req.query.name, 
		departmentId: req.query.departmentId, 
		abolished: Number(req.query.abolished)
	}, (err)=>{
		if (err){
			console.error(err);
			redirect('back');
		}
		else{
			redirect('back');
		}
	});
});
app.get('/postposition/(:id)', (req, res)=>{
	console.log(req.query);
	cadrs.setPosition({
		positionId: req.params.id,
		name: req.query.name, 
		departmentId: req.query.departmentId, 
		abolished: Number(req.query.abolished)
	}, (err)=>{
		if (err){
			console.error(err);
		}
		res.redirect('/position/'+req.params.id);
	})
});

app.get('/bonuses', function(req, res){
	cadrs.fetchBonuses((err, result)=>{
		if (err){
			console.error(err);
			res.status(500).end();
		}
		else{
			var data = {
				bonuses: result,
			};
			res.render('bonuses', data);
		}
	});
});

const PORT = 18092;

app.listen(PORT, function () {
	console.log('Прога по БД заработала, порт',PORT);
});
