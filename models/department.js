const Sequelize = require('sequelize');
const sequelize = require('../db-sequelize.js');

const Department = sequelize.define('department', {
    departmentId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
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

module.exports = Department;

const Position = require('./position.js');
Department.hasMany(Position, {
    foreignKey: 'departmentId'
});