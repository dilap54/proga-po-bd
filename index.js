const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const cadrs = require('./cadrs.js');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

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
	console.log(req.ips, req.ip, req.originalUrl);
	next();
});
app.use((req, res,next)=>{
	res.header("Content-Type", "text/html; charset=utf-8");
	next();
});


app.get('/', (req, res)=> {
	Promise.all([
		Worker.count({
			where: { isFired: false }
		}),
		Worker.count({
			where: { isFired: true	}
		}),
		Department.count({
			where:{	abolished: false}
		}),
		Department.count({
			where:{	abolished: true }
		}),
		Position.count({
			where:{	abolished: false}
		}),
		Position.count({
			where:{	abolished: true }
		}),
		Bonus.count({
			where:{ deleted: false  }
		}),
		Bonus.count({
			where:{ deleted: true  }
		})
	]).then((values)=>{
		var data = {
			count:{
				workers: {
					nonfired: values[0],
					fired: values[1]
				},
				departments: {
					nonabolished: values[2],
					abolished: values[3]
				},
				positions: {
					nonabolished: values[4],
					abolished: values[5]
				},
				bonuses: {
					nondeleted: values[6],
					deleted: values[7]
				}
			}
		};
		res.render('index', data);
	}).catch((err)=>{
		console.error(err);
		res.status(500).end(err);
	});
});

app.post('/createDB', (req, res)=>{ //TODO: заменить на POST
	cadrs.createDB(function(err, result){
		console.log(err, result);
		res.end(err+result);
	});
});

app.post('/dropDB', (req, res)=>{ //TODO: заменить на POST
	cadrs.dropDB(function(err, result){
		console.log(err, result);
		res.end(err+result);
	});
});

app.post('/generateDB', (req, res)=>{ //TODO: заменить на POST
	cadrs.generateDB(function(err, result){
		console.log(err, result);
		res.end(err+result);
	});
});

//Таблица с сотрудниками
app.get('/workers', function(req, res){
	var where;
	if (req.query.search){
		var searchString;
		if (req.query.search.indexOf('%') !== -1){
			searchString = req.query.search;
		}
		else{
			searchString = '%'+req.query.search+'%';
		}
		where = {
			[Op.or]:[
				{
					fullName:{
						[Op.like]: searchString
					}
				},
				{
					'$position.name$': {
						[Op.like]: searchString
					}
				},
				{
					'$position.department.name$': {
						[Op.like]: searchString
					}
				}
			]
		}
	};
	Worker.findAll({
		include: [
			{
				model: Position,
				include:[Department]
			}
		],
		where:where
	}).then((workers)=>{
		var data= {
			workers: workers,
			search: req.query.search
		};
		res.render('workers', data);
	}).catch((err)=>{
		console.error(err);
		res.status(500).end(err);
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
		res.status(500).end(err);
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
		res.status(500).end(err);
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
					attributes: ['workerBonusId','startDate', 'endDate']
				}
			}
		]
	}).then((worker)=>{
		if (worker){
			Promise.all([
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
				}),
				Bonus.findAll({
					where:{
						deleted: false
					}
				})
			]).then((values)=>{
				var departments = values[0];
				var bonuses = values[1];
				var data = {
					worker: worker,
					departments: departments,
					bonuses: bonuses
				};
				res.render('workerChange', data);
			}).catch((err)=>{
				console.error(err);
				res.status(500).end(err);
			});
		}
		else{
			res.status(404).end('Нет такого сотрудника');
		}
	}).catch((err)=>{
		console.error(err);
		res.status(500).end(err);
	})
});

//Запрос изменения сотрудника
app.post('/worker/(:workerId)', (req, res)=>{
	//Проверка входных данных
	if (!(req.body.fullName && req.body.birthDay && req.body.gender && req.body.isFired && req.body.positionId)){//Если не все данные на месте
		console.log(401);
		res.status(401).end(401);
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
					res.status(500).end(err);
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
		res.status(500).end(err);
	})
})

app.post('/worker/bonus/(:workerBonusId)', (req, res)=>{
	if (!(req.body.startDate && req.body.endDate)){
		console.log(401);
		res.status(401).end(401);
		return;
	}
	var workerBonusPromise;
	if (req.params.workerBonusId == 'new'){
		if (!(req.body.bonusId && req.body.workerId)){
			console.log(401);
			res.status(401).end(401);
			return;
		}
		else{
			workerBonusPromise = WorkerBonus.create({
				workerId: parseInt(req.body.workerId),
				bonusId: req.body.bonusId,
				startDate: req.body.startDate,
				endDate: req.body.endDate
			});
		}
	}
	else{
		workerBonusPromise = WorkerBonus.findOne({
			where:{
				workerBonusId: req.params.workerBonusId
			}
		});
	}
	workerBonusPromise.then((workerBonus)=>{
		if (workerBonus){
			workerBonus.startDate = req.body.startDate;
			workerBonus.endDate = req.body.endDate;
			console.log('workerBonus changed', workerBonus.changed());
			if (workerBonus.changed()){//Если новые данные отличаются от старых
				workerBonus.createdAt = Sequelize.fn('CURRENT_TIMESTAMP');
				workerBonus.save().then((newWorkerBonus)=>{//Сохранить новые данные в базе
					res.redirect('/worker/'+newWorkerBonus.workerId+'/change');
				}).catch((err)=>{
					console.error(err);
					res.status(500).end(err);
				});
			}
			else{//Если новые данные не отличаются от старых
				res.redirect('/worker/'+workerBonus.workerId+'/change');
			}
		}
		else{
			res.status(404).end('Нет такого сотрудника');
		}

	}).catch((err)=>{
		console.error(err);
		res.status(500).end(err);
	})
})


//Таблица отделов
app.get('/departments', (req, res)=>{
	var where;
	if (req.query.search){
		var searchString;
		if (req.query.search.indexOf('%') !== -1){
			searchString = req.query.search;
		}
		else{
			searchString = '%'+req.query.search+'%';
		}
		where = {
			name:{
				[Op.like]: searchString
			}
		}
	};
	Department.findAll({
		attributes:{
			include:[
				[Sequelize.fn('COUNT', Sequelize.col('positions.positionId')),'positionsCount'],
				//[Sequelize.fn('COUNT', Sequelize.col('positions->workers.workerId')),'workersCount']
			]
		},
		include:[
			{
				model: Position,
				attributes:	[]				
			},
			/*
			{
				model: Worker,
				attributes: [
					[Sequelize.fn('COUNT', Sequelize.col('worker.workerId')),'workersCount']
				],
				separate: true,
				group: ['worker.positionId'],
			}
			*/
		],
		group: ['department.departmentId'],
		where: where
	}).then((departments)=>{
		console.log(departments[0].get());
		var data = {
			departments: departments.map((item)=>{return item.get()}),
			search: req.query.search
		};
		res.render('departments', data);
	}).catch((err)=>{
		console.error('department.findAll error', err);
		res.status(500).end(err);
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
		res.status(500).end(err);
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
		res.status(500).end(err);
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
		res.status(500).end(err);
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
	var where;
	if (req.query.search){
		var searchString;
		if (req.query.search.indexOf('%') !== -1){
			searchString = req.query.search;
		}
		else{
			searchString = '%'+req.query.search+'%';
		}
		where = {
			[Op.or]:[
				{
					name:{
						[Op.like]: searchString
					}
				},
				{
					'$department.name$': {
						[Op.like]: searchString
					}
				}
			]
		}
	};
	Position.findAll({
		include: [Department],
		where: where
	}).then((positions)=>{
		var data = {
			positions: positions,
			search: req.query.search
		};
		res.render('positions', data);
	}).catch((err)=>{
		console.error(err);
		res.status(500).end(err);
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
		res.status(500).end(err);
	});
});

//Таблица с бонусами
app.get('/bonuses', (req, res)=>{
	var where;
	if (req.query.search){
		var searchString;
		if (req.query.search.indexOf('%') !== -1){
			searchString = req.query.search;
		}
		else{
			searchString = '%'+req.query.search+'%';
		}
		where = {
			[Op.or]:[
				{
					name:{
						[Op.like]: searchString
					}
				},
				{
					description: {
						[Op.like]: searchString
					}
				}
			]
		}
	};
	Bonus.findAll({
		where: where
	}).then((bonuses)=>{
		var data = {
			bonuses: bonuses,
			search: req.query.search
		};
		res.render('bonuses', data);
	}).catch((err)=>{
		console.error(err);
		res.status(500).end(err);
	});
});

//Запрос на создание должности
app.post('/bonus/new', (req, res)=>{
	if (req.body.name && req.body.description){
		Bonus.create({
			name: req.body.name,
			description: req.body.description
		}).then((bonus)=>{
			res.redirect('/bonus/'+bonus.bonusId);
		}).catch((err)=>{
			console.error(err);
			res.redirect('/bonuses/');
		})
	}
	else{
		res.status(401).end('Не полные данные')
	}
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
		res.status(500).end(err);
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
		res.status(500).end(err);
	});
});

//Описание бонуса
app.get('/bonus/(:bonusId)', (req, res)=>{
	Bonus.findOne({
		where:{
			bonusId: req.params.bonusId
		},
		include:[Worker]
	}).then((bonus)=>{
		var data = {
			bonus: bonus
		};
		res.render('bonus', data);
	}).catch((err)=>{
		console.error(err);
		res.status(500).end(err);
	});
});

//Запрос на удаление бонуса
app.post('/bonus/(:bonusId)/delete', (req, res)=>{
	Bonus.findOne({
		where:{
			bonusId: req.params.bonusId
		}
	}).then((bonus)=>{
		if (bonus){//Если bonus найден в базе
			return bonus.update({//Вернуть promise обновления должности
				deleted: true
			});
		}
		else{//Если bonus не найден в базе
			throw 'bonus not found';
		}
	}).then(
		(bonus)=>{//Если bonus найден в базе
			var data = {
				bonus: bonus
			}
			res.redirect('/bonus/'+bonus.bonusId);
		},
		(err)=>{//Если bonus не найден в базе
			console.error(err);
			res.status(404).end('Нет такой должности');
		}
	).catch((err)=>{
		console.error(err);
		res.status(500).end(err);
	});
});

//Запрос на восстановление бонуса
app.post('/bonus/(:bonusId)/undelete', (req, res)=>{
	Bonus.findOne({
		where:{
			bonusId: req.params.bonusId
		}
	}).then((bonus)=>{
		if (bonus){//Если bonus найден в базе
			return bonus.update({//Вернуть promise обновления должности
				deleted: false
			});
		}
		else{//Если bonus не найден в базе
			throw 'bonus not found';
		}
	}).then(
		(bonus)=>{//Если bonus найден в базе
			var data = {
				bonus: bonus
			}
			res.redirect('/bonus/'+bonus.bonusId);
		},
		(err)=>{//Если bonus не найден в базе
			console.error(err);
			res.status(404).end('Нет такой должности');
		}
	).catch((err)=>{
		console.error(err);
		res.status(500).end(err);
	});
});

app.get('/manage', (req, res)=>{
	res.render('manage');
})

const PORT = 18092;

app.listen(PORT, function () {
	console.log('Прога по БД заработала, порт',PORT);
});
