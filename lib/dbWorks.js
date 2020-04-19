var mysql = require('mysql');
let as=require('async');

var db=require('./db');

exports.loadTeamList=(callback)=>{
    db.query('SELECT teamName FROM teams', (err,teamsResult)=>{
        if(err){throw error};
        let teams=[];
        for(let i=0; i<teamsResult.length;i++){
            teams.push(teamsResult[i].teamName);
        };
        callback(teams); //[team1,team2,team3, ... ]
    });
};

exports.checkEachMembers=(weekNo,members, callback)=>{
    let inputValue='', i=0, j_forFirstComma=0;
    as.whilst(
        //조건
        function test(cb){ cb(null, i<members.length)},

        //실행문
        function memCheck (callback){
            db.query(`SELECT EXISTS(SELECT * FROM weekly WHERE week=? and mem_id=?)as exist`,[weekNo,members[i].id],
                     (err,existance, fields)=>{
                if(existance[0].exist===0){
                    if(j_forFirstComma!=0){inputValue+=','};
                    inputValue+=`(${weekNo},${members[i].id})`;
                    j_forFirstComma+=1
                }
                i++;
                callback (null, inputValue)
            })
        },

        //결과. 여기서 계속
        (err,inputValue) => {
            callback (null, inputValue)
        }
    );
}

exports.check=(query, inputs)=>{ //SELECT EXISTS(????)as exist
    db.query('SELECT EXISTS('+query+')as exist',inputs, (err,existance, fields)=>{
        return existance[0].exist
    });
};

