const Sequelize = require('sequelize');
const sequelize = require('../db-sequelize.js');

const WorkerHistory = sequelize.define('workerHistory', {
    workerHistoryId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    workerId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    fullName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    birthDay:{
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    gender:{
        type: Sequelize.TINYINT(1)
    },
    positionId:{
        type: Sequelize.INTEGER
    },
    isFired:{
        type: Sequelize.BOOLEAN,
        allowNull: false
    }
},
{
    tableName: 'workersHistory',
    updatedAt: false
});

module.exports = WorkerHistory;

const Worker = require('./worker.js');

WorkerHistory.belongsTo(Worker, {
    foreignKey: 'workerId'
});

const Position = require('./position.js');
WorkerHistory.belongsTo(Position, {
    foreignKey: 'positionId'
});