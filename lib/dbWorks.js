var mysql = require('mysql');
let as=require('async');

var db=require('./db');

exports.loadWeeksList=(query,columnHead, callback)=>{
    db.query(query, (err,weeksResult)=>{
        if(err){throw err};
        let weeks=[];
        for(let i=0; i<weeksResult.length;i++){
            //테스트용데이터(week 200000 이하) 제거
            if(weeksResult[i][columnHead]> 200000) weeks.push(weeksResult[i][columnHead]);
        };
        callback (weeks);
    });
};

exports.updateEachMembers=(weekNo)=>{
    db.query(`SELECT id,name FROM members`, (err, members) => {
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
                if (inputValue === '') console.log(`NOTHING TO UPDATE at ${weekNo}`) ; //더이상 batabase에 추가할게 없을경우
                else {
                    //batabase에 추가할게 있을경우
                    db.query('INSERT INTO weekly (week,mem_id) VALUES ' + [inputValue],
                        (err, result) => {
                            if (err) throw err;
                            console.log(`DATBASE weekly UPADATED at ${weekNo}!`);
                        }
                    );
                }
            }
        );
    });
}


//not use..
exports.loadList=(query,columnHead, callback)=>{
    db.query(query, (err,teamsResult)=>{
        if(err){throw err};
        let teams=[];
        for(let i=0; i<teamsResult.length;i++){
            teams.push(teamsResult[i][columnHead]);
        };
        callback (teams); //[team1,team2,team3, ... ]
    });
};
//not use..
exports.check=(query, inputs)=>{ //SELECT EXISTS(????)as exist
    db.query('SELECT EXISTS('+query+')as exist',inputs, (err,existance, fields)=>{
        return existance[0].exist
    });
};



