const Sequelize = require('sequelize');
const sequelize = require('../db-sequelize.js');


const Position = sequelize.define('position', {
    positionId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    departmentId:{
        type: Sequelize.INTEGER,
        allowNull: false
    },
    abolished:{
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
},
{
    createdAt: false,
    updatedAt: false
});

module.exports = Position;

const Department = require('./department.js');
Position.belongsTo(Department, {
    foreignKey: 'departmentId'
});

const Worker = require('./worker.js');
Position.hasMany(Worker, {
    foreignKey: 'positionId'
});