const express = require('express');
const app = express();
const pool = require('./db.js');
const cadrs = require('./cadrs.js');
const generator = require('./generator.js');

const Department = require('./models/department.js');
const Worker = require('./models/worker.js');
const Position = require('./models/position.js');
const Bonus = require('./models/bonus.js');
const WorkerBonus = require('./models/workerBonus.js');

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

app.get('/workers', function(req, res){
	Worker.findAll({
		include: [
			{
				model: Position,
				include:[Department]
			}
		]
	}).then((workers)=>{
		console.log(workers[0].get());
		var data= {
			workers: workers
		};
		res.render('workers', data);
	}).catch((err)=>{
		console.error(err);
		res.status(500).end();
	});
});

app.get('/worker/(:workerId)', (req, res)=>{
	Worker.findOne({
		where:{
			workerId: req.params.workerId
		},
		include: [
			{
				model: Position,
				include:[Department]
			},
			{
				model: Bonus,
				//include:[WorkerBonus]
			}
		]
	}).then((worker)=>{
		if (worker){
			console.log(worker.get({plain: true}));
			var data = {
				worker: worker
			};
			res.render('worker', data);
		}
		else{
			res.status(404).end('Нет такого сотрудника');
		}
	}).catch((err)=>{
		console.error(err);
		res.status(500).end();
	})
});

app.get('/departments', function(req, res){
	Department.findAll().then((departments)=>{
		var data = {
			departments: departments,
		};
		res.render('departments', data);
	}).catch((err)=>{
		console.error('department.findAll error', err);
		res.status(500).end();
	})
});

app.get('/departments/new', (req, res)=>{
	if (req.query.name){
		Department.create({
			name: req.query.name
		}).then((department)=>{
			res.redirect('/departments');
		}).catch((err)=>{
			console.error(err);
			res.redirect('/departments?error');
		});
	}
	else{
		res.redirect('/departments?error');
	}
});

//UNUSED
app.get('/departments/(:id)', (req,res)=>{
	Department.findOne({//найти отдел
		where:{
			departmentId: req.params.id
		}
	}).then((department)=>{
		if (department){//Если отдел есть
			return department.update({//Запросить обновление отдела
				abolished: req.query.abolished, 
				name: req.query.name
			});
		}
		else{//Если отдела нет
			res.redirect('/departments?404');
		}
	}).then((department)=>{//Если отдел обновлен
		res.redirect('/departments');
	}).catch((err)=>{//Если ошибка во время обновления отдела
		console.error(err);
		res.redirect('/departments?error');
	});
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
	Position.findAll().then((positions)=>{
		var data = {
			positions: positions,
		};
		res.render('positions', data);
	}).catch((err)=>{
		console.error(err);
		res.status(500).end();
	});
})

app.get('/position', (req, res)=>{
	res.render('position');
});

app.get('/position/(:id)', (req, res)=>{
	Position.findOne({
		where:{
			positionId: req.params.id
		}
	}).then((position)=>{
		var data = {
			position: position
		};
		res.render('position', data);
	}).catch((err)=>{
		console.error(err);
		res.status(500).end();
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
