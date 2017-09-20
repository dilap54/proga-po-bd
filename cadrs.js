const pool = require('./db.js');
const async = require('async');
const generator = require('./generator.js');

function createWorkerTable(callback){
    console.log('Создание WorkerTable');
    query = 'CREATE TABLE IF NOT EXISTS `os`.`worker`\
    ( `workerId` INT NOT NULL AUTO_INCREMENT ,\
        `fullName` VARCHAR(255) NOT NULL ,\
        `birthDay` DATE NOT NULL , \
        `sex` BOOLEAN NULL , \
        `workplaceId` INT NOT NULL , \
        `isFired` BOOLEAN NOT NULL DEFAULT FALSE, \
        `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ,\
        PRIMARY KEY (`workerId`), \
        INDEX (`workplaceId`) \
    ) ENGINE = InnoDB;\n';

    pool.query(query, callback);
}

function createDepartmentTable(callback){
    console.log('Создание DepartmentTable');
    query = 'CREATE TABLE IF NOT EXISTS `os`.`department` \
    ( `departmentId` INT NOT NULL AUTO_INCREMENT , \
        `name` VARCHAR(255) NOT NULL , \
        `abolished` BOOLEAN NOT NULL DEFAULT FALSE , \
        PRIMARY KEY (`departmentId`)\
    ) ENGINE = InnoDB;\n';

    pool.query(query, callback);
}

function createWorkPlaceTable(callback){
    console.log('Создание WorkplaceTable');
    query = 'CREATE TABLE IF NOT EXISTS `os`.`workplace` \
    ( `workplaceId` INT NOT NULL AUTO_INCREMENT , \
        `name` VARCHAR(255) NOT NULL ,\
        `departmentId` INT NOT NULL , \
        `abolished` BOOLEAN NOT NULL DEFAULT FALSE , \
        PRIMARY KEY (`workplaceId`), \
        INDEX (`departmentId`) \
    ) ENGINE = InnoDB;';

    pool.query(query, callback);
}

function createWorkerHistoryTable(callback){
    console.log('Создание WorkerHistoryTable');
    query = 'CREATE TABLE IF NOT EXISTS `os`.`workerhistory` \
    ( `workerhistoryId` INT NOT NULL AUTO_INCREMENT , \
        `workerId` INT NOT NULL , \
        `fullName` VARCHAR(255) NOT NULL , \
        `birthday` DATE NOT NULL , \
        `sex` BOOLEAN NULL , \
        `workplaceId` INT NULL , \
        `isFired` BOOLEAN NOT NULL , \
        `createdAt` TIMESTAMP NOT NULL , \
        PRIMARY KEY (`workerhistoryId`), \
        INDEX (`workerId`), \
        INDEX (`workplaceId`) \
    ) ENGINE = InnoDB;';

    pool.query(query, callback);
}

function createForegin_WorkplaceToDepartment(callback){
    console.log('Создание ограничения WorkplaceToDepartment');
    query = 'ALTER TABLE `workplace` \
        ADD CONSTRAINT `workplaceToDepartment` \
        FOREIGN KEY (`departmentId`) REFERENCES `department`(`departmentId`) \
        ON DELETE RESTRICT \
        ON UPDATE RESTRICT;';

    pool.query(query, callback);
}

function createForegin_WorkerToWorkplace(callback){
    console.log('Создание ограничения WorkplaceToDepartment');
    query = 'ALTER TABLE `worker` \
        ADD CONSTRAINT `workerToWorkplace` \
        FOREIGN KEY (`workplaceId`) REFERENCES `workplace`(`workplaceId`) \
        ON DELETE RESTRICT \
        ON UPDATE RESTRICT;';

    pool.query(query, callback);
}

function createForegin_WorkerHistoryToWorkplace(callback){
    console.log('Создание ограничения WorkerhistoryToWorkplace');
    query = 'ALTER TABLE `workerhistory` \
        ADD CONSTRAINT `workerhistoryToWorkplace` \
        FOREIGN KEY (`workplaceId`) REFERENCES `workplace`(`workplaceId`) \
        ON DELETE RESTRICT \
        ON UPDATE RESTRICT;';

    pool.query(query, callback);
}

function createForegin_WorkerHistoryToWorker(callback){
    console.log('Создание ограничения WorkerHistoryToWorker');
    query = 'ALTER TABLE `workerhistory` \
        ADD CONSTRAINT `workerhistoryToWorker` \
        FOREIGN KEY (`workerId`) REFERENCES `worker`(`workerId`) \
        ON DELETE RESTRICT \
        ON UPDATE RESTRICT;';

    pool.query(query, callback);
}

function createDB(callback){
    async.series([
        createWorkerTable,
        createDepartmentTable,
        createWorkPlaceTable,
        createWorkerHistoryTable,
        createForegin_WorkplaceToDepartment,
        createForegin_WorkerToWorkplace,
        createForegin_WorkerHistoryToWorkplace,
        createForegin_WorkerHistoryToWorker
    ], callback);
}

function dropDB(callback){
    console.log('Удаление всех таблиц');
    query = '\
        SET FOREIGN_KEY_CHECKS = 0;\n\
        DROP TABLE IF EXISTS `worker`;\n\
        DROP TABLE IF EXISTS `department`;\n\
        DROP TABLE IF EXISTS `workplace`;\n\
        DROP TABLE IF EXISTS `workerhistory`;\n\
        SET FOREIGN_KEY_CHECKS = 1;\n\
        ';

    pool.query(query, callback);
}

//exports.createWorkerTable = createWorkerTable;
//exports.createDepartmentTable = createDepartmentTable;
//exports.createWorkPlaceTable = createWorkPlaceTable;
//exports.createWorkerHistoryTable = createWorkerHistoryTable;
//exports.createForegin_WorkplaceToDepartment = createForegin_WorkplaceToDepartment;
//exports.createForegin_WorkerToWorkplace = createForegin_WorkerToWorkplace;
//exports.createForegin_WorkerHistoryToWorkplace = createForegin_WorkerHistoryToWorkplace;
//exports.createForegin_WorkerHistoryToWorker = createForegin_WorkerHistoryToWorker;

function generateDB(callback){
    generator.GeneratorBD((err, generatordb)=>{
        if (err){
            callback(err);
        }
        else{
            /*
            for (var i=0; i<14*7*3; i++){
                workers.push(generatordb.genWorker());
            }
            async.each(workers, (worker, callback)=>{

            }, 
            (err, result)=>{
                if (err){
                    callback(err);
                }
                else{
                    callback(null, result);
                }
            })
            */
            var departments = generatordb.getDepartments();
            var workplaces = generatordb.genWorkplaces();
            var workers = [];

            async.series([
                (callback)=>{
                    console.log('Заполнение таблицы отделов');
                    
                    async.each(departments, (department, callback)=>{
                        pool.query('INSERT INTO department (`name`)  VALUES(?);', department, callback);
                    }, 
                    callback);
                },
                (callback)=>{
                    console.log('Заполнение таблицы рабочих мест');
                    
                    async.each(workplaces, (workplace, callback)=>{
                        pool.query('INSERT INTO workplace (`name`, `departmentId`)  VALUES(?, ?);', [workplace.name, workplace.departmentId], callback);
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
                        var query = 'INSERT INTO worker (`fullName`, `birthDay`, `sex`, `workplaceId`) VALUES(?,?,?,?)';
                        pool.query(query, [worker.fullName, worker.birthDay, worker.sex, workplaceIdNum++], callback);
                    },
                    callback);
                }
            ], callback);
            
        }
    });
}

function fetchDB(callback){
    query = 'SELECT * FROM `worker` worker\
        LEFT OUTER JOIN \
            (SELECT name as placeName, workplaceId, departmentId FROM `workplace`) as place\
        ON worker.workplaceId = place.workplaceId\
        LEFT OUTER JOIN \
            (SELECT name as departName, departmentId FROM `department`) as depart\
        ON place.departmentId = depart.departmentId';
    pool.query(query, (err, result, fields)=>{
        callback(err, result, fields);
    });
}

function fetchDepartments(callback){
    query = 'SELECT * FROM `department`';
    pool.query(query, callback);
}

function fetchWorkplaces(callback){

}

exports.dropDB = dropDB;
exports.createDB = createDB;
exports.generateDB = generateDB;
exports.fetchDB = fetchDB;
exports.fetchDepartments = fetchDepartments;

