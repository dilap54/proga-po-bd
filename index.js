const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const pool = require('./db.js');
const cadrs = require('./cadrs.js');
const generator = require('./generator.js');

const Sequelize = require('sequelize');

const Department = require('./models/department.js');
const Worker = require('./models/worker.js');
const Position = require('./models/position.js');
const Bonus = require('./models/bonus.js');
const WorkerBonus = require('./models/workerBonus.js');
const WorkerHistory = require('./models/workerHistory.js');

app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use((req, res, next)=>{
	console.log(req.originalUrl);
	next();
});
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

//Таблица с сотрудниками
app.get('/workers', function(req, res){
	Worker.findAll({
		include: [
			{
				model: Position,
				include:[Department]
			}
		]
	}).then((workers)=>{
		var data= {
			workers: workers
		};
		res.render('workers', data);
	}).catch((err)=>{
		console.error(err);
		res.status(500).end();
	});
});

//Форма создания нового сотрудника
app.get('/worker/new', (req, res)=>{
	Department.findAll({
		where:{
			abolished: false
		},
		include: {
			model: Position,
			where: {
				abolished: false
			}
		}
	}).then((departments)=>{
		var data = {
			departments: departments
		}
		res.render('workerChange', data);
	}).catch((err)=>{
		console.error(err);
		res.status(500).end();
	});
});

//Подробная информация о сотруднике
app.get('/worker/(:workerId)', (req, res)=>{
	Worker.findOne({
		where:{
			workerId: req.params.workerId
		},
		include: [
			{
				model: Position,
				include: [Department]
			},
			{
				model: Bonus,
				through:{
					attributes: ['startDate', 'endDate']
				}
			},
			{
				model: WorkerHistory,
				include:[
					{
						model: Position,
						include: [Department]
					}
				]
			}
		],
		order: [
			[
				WorkerHistory, 'createdAt', 'DESC'
			]
		]
	}).then((worker)=>{
		if (worker){
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

//Форма изменения сотрудника
app.get('/worker/(:workerId)/change', (req, res)=>{
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
				through:{
					attributes: ['startDate', 'endDate']
				}
			}
		]
	}).then((worker)=>{
		if (worker){
			Department.findAll({
				where:{
					abolished: false
				},
				include: {
					model: Position,
					where: {
						abolished: false
					}
				}
			}).then((departments)=>{
				var data = {
					worker: worker,
					departments: departments
				}
				res.render('workerChange', data);
			}).catch((err)=>{
				console.error(err);
				res.status(500).end();
			});
		}
		else{
			res.status(404).end('Нет такого сотрудника');
		}
	}).catch((err)=>{
		console.error(err);
		res.status(500).end();
	})
});

//Запрос изменения сотрудника
app.post('/worker/(:workerId)', (req, res)=>{
	//Проверка входных данных
	if (!(req.body.fullName && req.body.birthDay && req.body.gender && req.body.isFired && req.body.positionId)){//Если не все данные на месте
		console.log(401);
		res.status(401).end();
		return;
	}
	//Создание instans'а worker'а
	var WorkerPromise;
	if (req.params.workerId == 'new'){//Если создается новый сотрудник
		WorkerPromise = new Promise((resolve, reject)=>{//Создать Promise, который вернет новый instanse
			resolve(Worker.build({}));
		})
	}
	else{//Если редактируется существующий сотрудник
		WorkerPromise = Worker.findOne({//Создать Promise, который вернет существующий instanse
			where:{
				workerId: req.params.workerId
			}
		})
	}
	WorkerPromise.then((worker)=>{
		if (worker){//Если работник в базе найден
			var oldWorker = Object.assign({}, worker.get({plain: true}));//Скопировать старые данные работника в другой объект
			//Заменить данные работника на новые
			worker.fullName = req.body.fullName;
			worker.birthDay = req.body.birthDay;
			worker.gender = parseInt(req.body.gender);
			worker.isFired = !!parseInt(req.body.isFired);
			worker.positionId = parseInt(req.body.positionId);
			if (worker.changed()){//Если новые данные отличаются от старых
				worker.createdAt = Sequelize.fn('CURRENT_TIMESTAMP');
				worker.save().then((newWorker)=>{//Сохранить новые данные в базе
					res.redirect('/worker/'+newWorker.workerId);
				}).catch((err)=>{
					console.error(err);
					res.status(500).end();
				});
				if (req.params.workerId != 'new'){
					WorkerHistory.create(oldWorker).then((data)=>{
						console.log('worker added to history');
					}).catch((err)=>{
						console.error(err);
					});
				}
			}
			else{//Если новые данные не отличаются от старых
				res.redirect('/worker/'+worker.workerId);
			}
		}
		else{
			res.status(404).end('Нет такого сотрудника');
		}
	}).catch((err)=>{
		console.error(err);
		res.status(500).end();
	})
})

//Таблица отделов
app.get('/departments', (req, res)=>{
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

//Подробная информация об отделе
app.get('/department/(:departmentId)', (req, res)=>{
	Department.findOne({
		where:{
			departmentId: req.params.departmentId
		},
		include:[Position]
	}).then((department)=>{
		if (department){
			var data = {
				department: department
			}
			res.render('department', data);
		}
		else{
			res.status(404).end('Нет такого отдела');
		}
	}).catch((err)=>{
		console.error(err);
		res.status(500).end();
	})
});

//Запрос на упразднение отдела
app.post('/department/(:departmentId)/abolishe', (req, res)=>{
	Department.findOne({//Найти отдел
		where:{
			departmentId: req.params.departmentId
		}
	}).then((department)=>{
		if (department){//Если отдел найден в базе
			return department.update({//Вернуть promise обновления отдела
				abolished: true
			});
		}
		else{//Если отдел не найден в базе
			throw 'Department not found';
		}
	}).then(
		(department)=>{//Если отдел найден в базе
			var data = {
				department: department
			}
			res.redirect('/department/'+department.departmentId);
		},
		()=>{//Если отдел не найден в базе
			res.status(404).end('Нет такого отдела');
			console.log('404');
		}
	).catch((err)=>{
		console.error(err);
		res.status(500).end();
	});
});

//Запрос на восстановление отдела
app.post('/department/(:departmentId)/unabolishe', (req, res)=>{
	Department.findOne({//Найти отдел
		where:{
			departmentId: req.params.departmentId
		}
	}).then((department)=>{
		if (department){//Если отдел найден в базе
			return department.update({//Вернуть promise обновления отдела
				abolished: false
			});
		}
		else{//Если отдел не найден в базе
			throw 'Department not found';
		}
	}).then(
		(department)=>{//Если отдел найден в базе
			var data = {
				department: department
			}
			res.redirect('/department/'+department.departmentId);
		},
		()=>{//Если отдел не найден в базе
			res.status(404).end('Нет такого отдела');
			console.log('404');
		}
	).catch((err)=>{
		console.error(err);
		res.status(500).end();
	});
});

//Запрос на создание отдела
app.post('/department/new', (req, res)=>{
	if (req.body.name){
		Department.create({
			name: req.body.name
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

app.get('/positions', (req, res)=>{
	Position.findAll({
		include: [Department]
	}).then((positions)=>{
		var data = {
			positions: positions,
		};
		res.render('positions', data);
	}).catch((err)=>{
		console.error(err);
		res.status(500).end();
	});
});

//Запрос на создание должности
app.post('/position/new', (req, res)=>{
	if (req.body.name && req.body.departmentId){
		Position.create({
			name: req.body.name,
			departmentId: parseInt(req.body.departmentId)
		}).then((position)=>{
			res.redirect('/department/'+req.body.departmentId);
		}).catch((err)=>{
			console.error(err);
			res.redirect('/department/'+req.body.departmentId+'?error');
		})
	}
	else{
		res.status(401).end('Не полные данные')
	}
});

app.get('/position/(:id)', (req, res)=>{
	Position.findOne({
		where:{
			positionId: req.params.id
		},
		include:[Department, Worker]
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

//Запрос на упразднение должности
app.post('/position/(:positionId)/abolishe', (req, res)=>{
	Position.findOne({//Найти должность
		where:{
			positionId: req.params.positionId
		}
	}).then((position)=>{
		if (position){//Если должность найден в базе
			return position.update({//Вернуть promise обновления должности
				abolished: true
			});
		}
		else{//Если должность не найден в базе
			throw 'Position not found';
		}
	}).then(
		(position)=>{//Если должность найден в базе
			var data = {
				position: position
			}
			res.redirect('/position/'+position.positionId);
		},
		()=>{//Если должность не найден в базе
			res.status(404).end('Нет такой должности');
			console.log('404');
		}
	).catch((err)=>{
		console.error(err);
		res.status(500).end();
	});
});

//Запрос на восстановление должности
app.post('/position/(:positionId)/unabolishe', (req, res)=>{
	Position.findOne({//Найти должность
		where:{
			positionId: req.params.positionId
		}
	}).then((position)=>{
		if (position){//Если должность найден в базе
			return position.update({//Вернуть promise обновления должности
				abolished: false
			});
		}
		else{//Если должность не найден в базе
			throw 'Position not found';
		}
	}).then(
		(position)=>{//Если должность найден в базе
			var data = {
				position: position
			}
			res.redirect('/position/'+position.positionId);
		},
		()=>{//Если должность не найден в базе
			res.status(404).end('Нет такой должности');
			console.log('404');
		}
	).catch((err)=>{
		console.error(err);
		res.status(500).end();
	});
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
