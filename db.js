var Mysql = require('mysql');

mysqlConfig = {
	connectionLimit : 5,
    database: 'os',
    user	: 'os',
    password: '123456', //у этого юзера нет admin-прав в базе, можешь не пытаться
    multipleStatements: true
};

var mysqlPool = Mysql.createPool(mysqlConfig);

module.exports = mysqlPool;