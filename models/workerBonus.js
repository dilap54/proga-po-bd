const Sequelize = require('sequelize');
const sequelize = require('../db-sequelize.js');

const WorkerBonus = sequelize.define('workerBonus', {
    workerBonusId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    bonusId:{
        type: Sequelize.INTEGER
    },
    workerId:{
        type: Sequelize.INTEGER
    },
    startDate:{
        type: Sequelize.DATE
    },
    endDate:{
        type: Sequelize.DATE
    }
},
{
    tableName: 'workersBonuses',
    createdAt: false,
    updatedAt: false
});

module.exports = WorkerBonus;