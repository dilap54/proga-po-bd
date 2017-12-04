const sequelize = require('./db-sequelize.js');
const fs = require('fs');
const async = require('async');
const generator = require('./generator.js');

const Department = require('./models/department.js');
const Worker = require('./models/worker.js');
const Position = require('./models/position.js');
const Bonus = require('./models/bonus.js');
const WorkerBonus = require('./models/workerBonus.js');
const WorkerHistory = require('./models/workerHistory.js');

var tables = [
    {
        name: 'workers',
        sql: 'createWorkers.sql'
    },
    {
        name: 'workersHistory',
        sql: 'createWorkersHistory.sql'
    },
    {
        name: 'departments',
        sql: 'createDepartments.sql'
    },
    {
        name: 'positions',
        sql: 'createPositions.sql'
    },
    {
        name: 'bonuses',
        sql: 'createBonuses.sql'
    },
    {
        name: 'workersBonuses',
        sql: 'createWorkersBonuses.sql'
    }
];

var creatingFuncionsArray = tables.map((table)=>{
    return (callback)=>{
        console.log('Создание таблицы', table.name);
        var query = fs.readFileSync('./DB-schema/'+table.sql).toString('utf8');
        sequelize.query(query).then((result)=>{
            callback(null, result);
        }).catch((err)=>{
            callback(err);
        })
    };
});

var constraints = [
    {
        name: 'positionsToDepartment',
        sql: 'foregin_positionToDepartment.sql'
    },
    {
        name: 'workerToPosition',
        sql: 'foregin_workerToPosition.sql'
    },
    {
        name: 'workerHistoryToPosition',
        sql: 'foregin_workerHistoryToPosition.sql'
    },
    {
        name: 'workerHistoryToWorkers',
        sql: 'foregin_workerHistoryToWorker.sql'
    },
    {
        name: 'workerBonusToWorker',
        sql: 'foregin_workerBonusToWorker.sql'
    },
    {
        name: 'workerBonusToBonus',
        sql: 'foregin_workerBonusToBonus.sql'
    }
];

var creatingConstraints = constraints.map((constraint)=>{
    return (callback)=>{
        console.log('Создание ограничения', constraint.name);
        var query = fs.readFileSync('./DB-schema/'+constraint.sql).toString('utf8');
        console.log(query);
        sequelize.query(query).then((result)=>{
            callback(null, result);
        }).catch((err)=>{
            callback(err);
        })
    };
});


function createDB(callback){
    async.series(creatingFuncionsArray.concat(creatingConstraints), callback);
    /*
    Department.sync()
        .then(Position.sync())
        .then(Worker.sync())
        .then(Bonus.sync())
        .then(WorkerBonus.sync())
        .then(WorkerHistory.sync())
        .then((result)=>{
            callback(null, result);
        }).catch((err)=>{
            callback(err);
        })
    */
    /*
    Promise.all([Department.sync(), Position.sync(), Worker.sync(), Bonus.sync(), WorkerBonus.sync(), WorkerHistory.sync()]).then((result)=>{
        callback(null, result);
    }).catch((err)=>{
        callback(err);
    })
    */
}

function dropDB(callback){
    console.log('Удаление всех таблиц');
    var query = 'SET FOREIGN_KEY_CHECKS = 0;\n';
    tables.forEach((table)=>{
        query += 'DROP TABLE IF EXISTS `'+table.name+'`;\n';
    });
    query += 'SET FOREIGN_KEY_CHECKS = 1;\n';
    sequelize.query(query).then((result)=>{
        callback(null, result);
    }).catch((err)=>{
        callback(err);
    })
}

function generateDB(callback){
    generator.GeneratorBD((err, generatordb)=>{
        if (err){
            callback(err);
        }
        else{
            var departments = generatordb.getDepartments().map((department)=>{
                return {
                    name: department
                };
            });
            var workplaces = generatordb.genWorkplaces();
            var workers = [];

            Department.bulkCreate(departments).then(()=>{
                return Position.bulkCreate(workplaces);
            }).then(()=>{
                var workplaceIdNum = 1;
                for (var i=0; i<workplaces.length; i++){
                    var worker = generatordb.genWorker();
                    worker.positionId = i+1;
                    workers.push(worker);
                }
                return Worker.bulkCreate(workers);
            }).then(()=>{
                callback(null);
            }).catch((err)=>{
                callback(err);
            })            
        }
    });
}


exports.dropDB = dropDB;
exports.createDB = createDB;
exports.generateDB = generateDB;

