const Sequelize = require('sequelize');
const sequelize = require('../db-sequelize.js');

const Bonus = sequelize.define('bonus', {
    bonusId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    description: {
        type: Sequelize.STRING,
    },
    deleted:{
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
},
{
    tableName: 'bonuses',
    createdAt: false,
    updatedAt: false
});

module.exports = Bonus;

const WorkerBonus = require('./workerBonus.js');
const Worker = require('./worker.js');

Bonus.belongsToMany(Worker,{ through:WorkerBonus, foreignKey: 'bonusId'});