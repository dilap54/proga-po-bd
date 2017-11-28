const pool = require('./db.js');
const fs = require('fs');
const async = require('async');
const generator = require('./generator.js');


function buildUpdate(table, set, where){
    var setArr = []
    for (key in set){
        if (set[key] !== undefined){
            setArr.push('`'+key+'` = '+pool.escape(set[key]));
        }
    }
    var whereArr = []
    for (key in where){
        if (where[key] !== undefined){
            whereArr.push('`'+key+'` = '+pool.escape(where[key]));
        }
    }
    console.log('setArr', setArr.join(', '));
    console.log('whereArr', whereArr.join('AND'));
    return 'UPDATE `'+table+'` SET '+setArr.join(', ')+' WHERE '+whereArr.join('AND');
}


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
        pool.query(query, callback);
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
        pool.query(query, callback);
    };
});


function createDB(callback){
    async.series(creatingFuncionsArray.concat(creatingConstraints), callback);
}

function dropDB(callback){
    console.log('Удаление всех таблиц');
    var query = 'SET FOREIGN_KEY_CHECKS = 0;\n';
    tables.forEach((table)=>{
        query += 'DROP TABLE IF EXISTS `'+table.name+'`;\n';
    });
    query += 'SET FOREIGN_KEY_CHECKS = 1;\n';
    pool.query(query, callback);
}

function generateDB(callback){
    generator.GeneratorBD((err, generatordb)=>{
        if (err){
            callback(err);
        }
        else{
            var departments = generatordb.getDepartments();
            var workplaces = generatordb.genWorkplaces();
            var workers = [];

            async.series([
                (callback)=>{
                    console.log('Заполнение таблицы отделов');
                    
                    async.each(departments, (department, callback)=>{
                        pool.query('INSERT INTO departments (`name`)  VALUES(?);', department, callback);
                    }, 
                    callback);
                },
                (callback)=>{
                    console.log('Заполнение таблицы должностей');
                    
                    async.each(workplaces, (workplace, callback)=>{
                        pool.query('INSERT INTO positions (`name`, `departmentId`)  VALUES(?, ?);', [workplace.name, workplace.departmentId], callback);
                    }, 
                    callback);
                },
                (callback)=>{
                    console.log('Заполнение таблицы сотрудников');
                    var workplaceIdNum = 1;
                    for (var i=0; i<workplaces.length; i++){
                        workers.push(generatordb.genWorker());
                    }

                    async.each(workers, (worker, callback)=>{
                        var query = 'INSERT INTO workers (`fullName`, `birthDay`, `gender`, `positionId`) VALUES(?,?,?,?)';
                        pool.query(query, [worker.fullName, worker.birthDay, worker.sex, workplaceIdNum++], callback);
                    },
                    callback);
                }
            ], callback);
            
        }
    });
}

function fetchDB(callback){
    var query = 'SELECT * FROM `workers` worker\
        LEFT OUTER JOIN \
            (SELECT name as placeName, positionId, departmentId FROM `positions`) as place\
        ON worker.positionId = place.positionId\
        LEFT OUTER JOIN \
            (SELECT name as departName, departmentId FROM `departments`) as depart\
        ON place.departmentId = depart.departmentId';
    pool.query(query, callback);
}

function fetchWorkers(callback){
    var query = 'SELECT * FROM `workers`';
    pool.query(query, callback)
}

function fetchWorkersHistory(callback){
    var query = 'SELECT * FROM `workersHistory`';
    pool.query(query, callback)
}

function fetchDepartments(callback){
    var query = 'SELECT * FROM `departments`';
    pool.query(query, callback)
}
function addDepartment(department, callback){
    pool.query('INSERT INTO departments (`name`)  VALUES(?);', department.name, callback);
}
function updateDepartment(department, callback){
    console.log(department);
    var query = buildUpdate('departments', {
        name: department.name, 
        abolished: department.abolished
    }, {
        departmentId: department.departmentId
    });
    console.log(query);
    pool.query(query, callback);
}

function fetchPositions(callback){
    var query = 'SELECT * FROM `positions`';
    pool.query(query, callback)
}
function getPosition(positionId, callback){
    pool.query(
        'SELECT * FROM `positions` as positions\
        JOIN (\
            SELECT departmentId, name as departmentName FROM `departments`\
        ) as departments\
        ON	positions.departmentId = departments.departmentId\
        WHERE positions.positionId = ?',
        positionId,
        callback
    )
}
function setPosition(position, callback){
    if (position.positionId){
        console.log(position);
        var query = buildUpdate('positions',{
            name: position.name, 
            abolished: position.abolished
        }, {
            positionId: position.positionId
        });
        pool.query(query, callback);
    }
    else{
        pool.query('INSERT INTO positions (`name`, `abolished`, `departmentId`) VALUES (?,?,?)', [position.name, position.abolished, position.departmentId], callback);
    }
}

function fetchBonuses(callback){
    var query = 'SELECT * FROM `bonuses`';
    pool.query(query, callback)
}

function fetchWorkersBonuses(callback){
    var query = 'SELECT * FROM `workersBonuses`';
    pool.query(query, callback)
}

exports.dropDB = dropDB;
exports.createDB = createDB;
exports.generateDB = generateDB;
exports.fetchDB = fetchDB;

exports.fetchWorkers = fetchWorkers;

exports.fetchWorkersHistory = fetchWorkersHistory;

exports.fetchDepartments = fetchDepartments;
exports.addDepartment = addDepartment;
exports.updateDepartment = updateDepartment;

exports.fetchPositions = fetchPositions;
exports.getPosition = getPosition;
exports.setPosition = setPosition;

exports.fetchBonuses = fetchBonuses;

exports.fetchWorkersBonuses = fetchWorkersBonuses;

