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
        let inputlongAbId='';
        as.whilst(
            //조건
            function test(cb){ cb(null, i<members.length)},

            //실행문
            function memCheck (callback){
                db.query(`SELECT EXISTS(SELECT * FROM weekly WHERE week=? and mem_id=?)as exist`,[weekNo,members[i].id],
                         (err,existance, fields)=>{
                    if(existance[0].exist===0){ //weekNo주에 member[i]가 없어서 새로 만듦
                        if(j_forFirstComma!=0){inputValue+=','};
                        inputValue+=`(${weekNo},${members[i].id})`;
                        j_forFirstComma+=1;
                    }
                   
                    
                    db.query('select mem_id,attendance from weekly WHERE mem_id=? ORDER BY week DESC LIMIT 6;',[ members[i].id ],
                            (err,ATlogFor6, fields)=>{
                        let marker_forAb=1;
                        for(let k=0;k<ATlogFor6.length ;k++){
                            if (ATlogFor6[k].attendance===1 || ATlogFor6[k].attendance===2) marker_forAb=0;
                        }
                        if (marker_forAb !== 0) { //6주연속 결석이므로 장기결석처리
                            inputlongAbId+=','+i;
                        }
                    });
                    i++;
                    callback (null, inputValue, inputlongAbId)
                })
            },

            //결과. 여기서 계속
            (err,inputValue,inputlongAbId) => {
                let sendMessageOrNot=0;
                if (inputValue === '') console.log(`NOTHING TO UPDATE at ${weekNo}`) ; //더이상 batabase에 추가할게 없을경우
                else {
                    //batabase에 추가할게 있을경우
                    db.query('INSERT INTO weekly (week,mem_id) VALUES ' + [inputValue],
                        (err, result) => {
                            if (err) throw err;
                            console.log(`DATBASE weekly UPADATED at ${weekNo}!`);
                            sendMessageOrNot+=1
                        }
                    );
                }
                
                if(inputlongAbId === []) console.log(`nobody changed into 장기결석`) ; 
                else{
                    db.query(`UPDATE members SET longAbsentee=1 WHERE id IN (${inputlongAbId.substr(1)})`,(err,result)=>{
                        if (err) throw err;
                        console.log(result.changedRows + ` member(s) changed into 장기결석`);
                        sendMessageOrNot+=1
                    })
                }
                // if(sendMessageOrNot>0)
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



