const fs = require('fs');
const async = require('async');

function getRandomInt(min, max) {
    if (max)
        return Math.floor(Math.random() * (max - min)) + min;
    else
        return Math.floor(Math.random() * min);
}

function getRandomFrom(array){
    return array[getRandomInt(array.length)];
}

function readStrings(path, callback){
    fs.readFile(path, (err, data)=>{
        if (err){
            callback(err);
        }
        else{
            var names = data.toString('utf8').split('\n')
                .map((item)=>{
                    return item.trim();
                })
                .filter((item)=>{
                    return item.length>2
                })
            callback(null, names);
        }
    });
}

function GeneratorBD(callback){
    this.db = {};
    async.parallel(
        {
            namesFemale: (callback)=>{
                readStrings('./testData/imena_g.txt', callback);
            },
            namesMale: (callback)=>{
                readStrings('./testData/imena_m.txt', callback);
            },
            surnamesMale: (callback)=>{
                readStrings('./testData/surname_m.txt', callback);
            },
            surnamesFemale: (callback)=>{
                readStrings('./testData/surname_g.txt', callback);
            },
            grandMale: (callback)=>{
                readStrings('./testData/otchestva_m.txt', callback);
            },
            grandFemale: (callback)=>{
                readStrings('./testData/otchestva_g.txt', callback);
            },
            departments: (callback)=>{
                readStrings('./testData/departments.txt', callback);
            },
            workplaces: (callback)=>{
                readStrings('./testData/workplaces.txt', callback);
            },
        },
        (err, data)=>{
            if (err){
                callback(err);
            }
            else{
                this.db = data;
                callback(null, this);
            }
        }
    );

    this.genNameMale = function(){
        return getRandomFrom(this.db.namesMale);
    }
    this.genNameFemale = function(){
        return getRandomFrom(this.db.namesFemale);
    }
    this.genSurnameMale = function(){
        return getRandomFrom(this.db.surnamesMale);
    }
    this.genSurnamesFemale = function(){
        return getRandomFrom(this.db.surnamesFemale);
    }
    this.genGrandMale = function(){
        return getRandomFrom(this.db.grandMale);
    }
    this.genGrandFemale = function(){
        return getRandomFrom(this.db.grandFemale);
    }
    this.genBirthDay = function(){
        return new Date(getRandomInt(31525200000, 1009832400000));
    }

    this.genWorker = function(){
        var name, surname, grandname, sex;
        if (Math.random()>0.5){
            name = this.genNameMale();
            surname = this.genSurnameMale();
            grandname = this.genGrandMale();
            sex = false;
        }
        else{
            name = this.genNameFemale();
            surname = this.genSurnamesFemale();
            grandname = this.genGrandFemale();
            sex = true;
        }
        var worker = {
            fullName: surname +' '+ name +' '+ grandname,
            sex: sex,
            birthDay: this.genBirthDay()
        };
        return worker;
    }

    this.getDepartments = function(){
        return this.db.departments;
    }
    this.getWorkplaces = function(){
        return this.db.workplaces;
    }

    this.genWorkplaces = function(){
        var workplaces = [];
        var deps = this.getDepartments();
        var works = this.getWorkplaces();
        for (var i=1; i<=deps.length; i++){
            for (var y=0; y<getRandomInt(1, 5); y++){
                workplaces.push({
                    name: works[getRandomInt(works.length)],
                    departmentId: i
                });
            }
        }
        return workplaces;
    }
}

function generateWorkers(num, callback){
    GeneratorBD((err, generator)=>{
        if (err){
            callback(err);
        }
        else{
            var workers = [];
            for (var i=0; i<num; i++){
                workers.push(generator.genWorker());
            }
            callback(null, workers);
        }
    })
}

exports.GeneratorBD = GeneratorBD;
exports.generateWorkers = generateWorkers;