const Sequelize = require('sequelize');
const sequelize = require('../db-sequelize.js');

const Worker = sequelize.define('worker', {
    workerId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
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
    updatedAt: false
});

module.exports = Worker;

const Position = require('./position.js');
Worker.belongsTo(Position, {
    foreignKey: 'positionId'
});

const WorkerBonus = require('./workerBonus.js');
const Bonus = require('./bonus.js');

Worker.belongsToMany(Bonus, { through:WorkerBonus, foreignKey: 'workerId'});