var http = require('http');
var fs = require('fs');
var url= require('url'); //http, fs, url 모듈 사용 선언
var qs = require('querystring');
var express = require('express');
var mysql = require('mysql');
let as=require('async');


const cal=require('./lib/calculate.js');
var db=require('./lib/db');
var dbW=require('./lib/dbWorks');




var app = express();
app.locals.pretty=true;    //전송하는 코드를 '보기 이쁘게' 바뀌줌

app.set('view engine','pug');  //템플릿 엔진으로 pug 사용
app.set('views','./views')    // pug파일들은 ./views에 있다




function makeNewWeekly(teams,weekNo, callbackFunc){
    let initialWeekly={} //"teamName":[]
    let initialInfos={
        "name": "",
        "attendance": 0,
        "bibleRead": 0,
        "bibleMemorise": false,
        "longAbsentee": true
    };
    let initialInfos_copy=''
    for(let i=0; i<teams.length;i++){
        initialWeekly[teams[i].teamName]=[];
    };
    fs.readFile('data/members/members.json','utf-8',(err,data2)=>{
        let members=JSON.parse(data2);
        for(let j=0;j<members.length;j++){
            let herTeam=members[j].team;
            initialInfos.name=members[j].name; //initialInfos에 이름 넣어주기
            initialInfos.longAbsentee=members[j].longAbsentee; //initialInfos에 장결여부 넣어주기
            initialInfos_copy=JSON.parse(JSON.stringify(initialInfos)); //딕셔너리인 Infos를 문자열 Infos_copy로 바꾸어 깊은 복사!
            initialWeekly[herTeam].push(initialInfos_copy);
        };
        let initialWeekly_string=JSON.stringify(initialWeekly);
        fs.writeFile(`data/weekly/${weekNo}.json`, initialWeekly_string, (err)=>{
            callbackFunc(); //콜백
        });
    });
}


// 분야별 등수 세우기        
// 총점수
// 총등수
function calRank(result_count,teamList, callbackFunc){
    let atPoint=[];
    let readPoint=[];
    let memoPoint=[];
    let totalPoint=[]
    let rule={1:5,2:4,3:3,4:2,5:1};
    
    for (let i=0;i<teamList.length;i++){
        let initPoint=0
        initPoint+= result_count[teamList[i]].attendance *10;
        initPoint+= result_count[teamList[i]].tardy*5;
        initPoint+= (result_count[teamList[i]].total -result_count[teamList[i]].longAbsentee -result_count[teamList[i]].attendance )*-2;
        initPoint/= result_count[teamList[i]].total -result_count[teamList[i]].longAbsentee
        atPoint.push(initPoint);
        
        initPoint=0
        initPoint+= result_count[teamList[i]].bibleRead;
        initPoint/= result_count[teamList[i]].attendance+result_count[teamList[i]].tardy;
        readPoint.push(initPoint);
        
        initPoint=0
        initPoint+= result_count[teamList[i]].bibleMemorise;
        initPoint/= result_count[teamList[i]].attendance+result_count[teamList[i]].tardy;
        memoPoint.push(initPoint);
    };
    console.log(atPoint,readPoint,memoPoint);
    
    function getRanks(arr) {
        var sorted = arr.slice().sort(function(a,b){return b-a});
        return arr.slice().map(function(v){ return sorted.indexOf(v)+1 });
    };
    let rank={};
    rank.at=getRanks(atPoint);
    rank.read=getRanks(readPoint);
    rank.memo=getRanks(memoPoint);
    console.log(rank);
    for (let i=0;i<teamList.length;i++){
        totalPoint.push(rule[rank.at[i]]*2+rule[rank.read[i]]+rule[rank.memo[i]]);
    };
    console.log(totalPoint);
    rank.final=getRanks(totalPoint);
    callbackFunc(rank, totalPoint);
};

app.get('/',(req,res)=>{
    let weekNo=cal.countWeek(Date()) //날짜서식 정리
    
    dbW.loadTeamList((teams)=>{    //teams = [team1,team2,team3, ... ]
        console.log(teams); 
        
        db.query(`SELECT id,name FROM members`,(err,members)=>{
                
                dbW.checkEachMembers(weekNo,members, (err,inputValue)=>{
                    if(inputValue===''){ //더이상 batabase에 추가할게 없을경우
                        res.render('basetemp',{
                            'loadPage': 'home',
                            'week': weekNo, //자동으로 현재 주차 나오도록
                            'teams':teams
                        });
                        
                    }else{ //batabase에 추가할게 있을경우
                        db.query("INSERT INTO weekly (week,mem_id) VALUES "+[inputValue], (err,result)=>{
                            if(err) throw err;
                            res.writeHead(302, {Location:'/'}); //home으로 리턴
                            res.end();
                        });
                    };
                });
        });
        
    
    // SELECT members.id,name,longAbsentee,team_id,weekly.id,week, mem_id, attendance, bibleRead,bibleMemorise FROM members LEFT JOIN weekly ON members.id=weekly.mem_id;
    // SELECT members.id,name,longAbsentee,team_id,weekly.id,week, mem_id FROM members LEFT JOIN weekly ON members.id=weekly.mem_id;
    // DELETE FROM weekly WHERE week=202004.3;
    });    
});

// /thisweek?menu=attendance&team=teamA
app.get('/thisweek', function(req,res){
    var _url = req.url;
    var pathName = url.parse(_url, true).pathname;
    let queryData=url.parse(_url,true).query;
    let qweek=queryData.week;
    let teamsBeforeParse=fs.readFileSync('data/members/teams.json','utf-8') //조 이름, 조별 정보 불러오기
    let teams=JSON.parse(teamsBeforeParse);
    fs.readdir('data/weekly', (err, dirs) => {
        fs.readFile(`data/weekly/${qweek}.json`,'utf-8', (err, data)=>{
            let weekly=JSON.parse(data);
            res.render('basetemp', {
                'loadPage': 'weekly',
                'teams':teams, //조별정보
                'weekly':weekly,
                'mainDiv':queryData.menu, 
                'team':queryData.team, //필수 query
                'week':queryData.week, //필수 query
                'dirs':dirs
            }); //temp 라는 템플릿파일 렌더링해서 전송. {} 안에 dict로 변수들 전송
        });
    });
});

app.get('/thisweek_process', function(req,res){
    var _url = req.url;
    var pathName = url.parse(_url, true).pathname;
    let queryData=url.parse(_url,true).query;
    let qType=queryData.type;
    let qName=queryData.name;
    let qTeam=queryData.team;
    let qweek=queryData.week;
    console.log(qTeam);
    
    if(qType==='longAbsentee'){
        fs.readFile(`data/weekly/${qweek}.json`,'utf-8',(err,dict)=>{
            fs.readFile(`data/members/members.json`,'utf-8',(err,dict2)=>{
                let Jdict=JSON.parse(dict);
                let searchNum_week=-1;
                let teamList=Jdict[qTeam];   
                for (let i=0;i<teamList.length;i++){ //좀더 나은 정렬방법??
                    if(teamList[i].name===qName){
                        searchNum_week=i;
                    }
                };        //여기까지 qWeek.json 파일처리
                
                let Jmembers=JSON.parse(dict2);
                let searchNum_mem=-1;
                for(let i=0;i<Jmembers.length;i++){
                    if(Jmembers[i].name===qName){
                        searchNum_mem=i;
                    }                    
                };        //여기까지 members.json 파일처리
                console.log(searchNum_week,searchNum_mem);
                
                if(teamList[searchNum_week][qType]){
                    teamList[searchNum_week][qType]= false;
                    Jmembers[searchNum_mem][qType]= false;
                }else{
                    teamList[searchNum_week][qType]= true;
                    Jmembers[searchNum_mem][qType]= true;
                };
                console.log(teamList[searchNum_week][qType],Jmembers[searchNum_mem][qType]);
                let Jdict_string=JSON.stringify(Jdict);
                let Jmembers_string=JSON.stringify(Jmembers);
                fs.writeFile(`data/weekly/${qweek}.json`,Jdict_string, (err)=>{
                    fs.writeFile('data/members/members.json',Jmembers_string, (err)=>{
                        res.writeHead(302, {Location:'/thisweek?team='+qTeam+'&week='+qweek});
                        res.end();
                    });
                });
            });
        });
    }else if(qType==='attendance'){
        fs.readFile(`data/weekly/${qweek}.json`,'utf-8',(err,dict)=>{
            console.log(dict);
            let Jdict=JSON.parse(dict);
            let searchNum=-1;
            let teamList=Jdict[qTeam]; //나중에 조별 수정할때 사용!
            for (let i=0;i<teamList.length;i++){ //좀더 나은 정렬방법??
                if(teamList[i].name===qName){
                    searchNum=i;
                }
            };
            if(teamList[searchNum][qType] < 3 ){
                teamList[searchNum][qType]++;
            }else{ //3또는 undefined
              teamList[searchNum][qType]=1  
            };
            console.log(Jdict)
            let Jdict_string=JSON.stringify(Jdict);
            fs.writeFile(`data/weekly/${qweek}.json`,Jdict_string, (err)=>{
                res.writeHead(302, {Location:'/thisweek?team='+qTeam+'&week='+qweek});
                res.end();
            });
        });
    }else if(qType==='bibleRead'){
        fs.readFile(`data/weekly/${qweek}.json`,'utf-8',(err,dict)=>{
            console.log(dict);
            let Jdict=JSON.parse(dict);
            let searchNum=-1;
            let teamList=Jdict[qTeam]; //나중에 조별 수정할때 사용!
            for (let i=0;i<teamList.length;i++){ //좀더 나은 정렬방법??
                if(teamList[i].name===qName){
                    searchNum=i;
                }
            };
            teamList[searchNum][qType]++;
            console.log(Jdict)
            let Jdict_string=JSON.stringify(Jdict);
            fs.writeFile(`data/weekly/${qweek}.json`,Jdict_string, (err)=>{
                res.writeHead(302, {Location:'/thisweek?team='+qTeam+'&week='+qweek});
                res.end();
            });
        });
    }else if(qType==='bibleMemorise'){
        fs.readFile(`data/weekly/${qweek}.json`,'utf-8',(err,dict)=>{
            console.log(dict);
            let Jdict=JSON.parse(dict);
            let searchNum=-1;
            let teamList=Jdict[qTeam]; //나중에 조별 수정할때 사용!
            for (let i=0;i<teamList.length;i++){ //좀더 나은 정렬방법??
                if(teamList[i].name===qName){
                    searchNum=i;
                }
            };
            teamList[searchNum][qType]= teamList[searchNum][qType]? false:true;
            console.log(Jdict)
            let Jdict_string=JSON.stringify(Jdict);
            fs.writeFile(`data/weekly/${qweek}.json`,Jdict_string, (err)=>{
                res.writeHead(302, {Location:'/thisweek?team='+qTeam+'&week='+qweek});
                res.end();
            });
        });
    }else{
        res.writeHead(200);
        res.end('error');
    };
});

app.get('/newMember', (req,res)=>{
    var _url = req.url;
    let queryData=url.parse(_url,true).query;
    let qTeam=queryData.team;
    let qweek=queryData.week
    let teamsBeforeParse=fs.readFileSync('data/members/teams.json','utf-8') //조 이름, 조별 정보 불러오기
    let teams=JSON.parse(teamsBeforeParse);
    res.render('basetemp',{
        'loadPage': 'newMember',
        'teams':teams, //조별정보
        'team':qTeam, 
        'week':qweek});
});

app.post('/newMember_process', (req,res)=>{
    var body = '';        
    req.on('data', function(data){ 
        body+=data;
        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6)
        req.connection.destroy();
    });
    req.on('end', function(data){ //더이상 들어올 정보가 없을때 'end' 호출
        var _url = req.url;
        let queryData=url.parse(_url,true).query;
        let qweek=queryData.week;
        let qTeam=queryData.team; //url정보 가져오기
        
        var post = qs.parse(body); //body json 형식으로 변환
        console.log(qweek);
        let Nname=post.name;
        let initDic={ "name": "", "phoneNumber": "", "home": "", "brithday": "","team":"","joinDate":"", "longAbsentee": false, "specialInfo": "" }
        initDic.name=post.name;
        initDic.phoneNumber=post.phoneNumber;
        initDic.birthday=sf("{0:0000}.{1:00}.{2:00}",post.year*1,post.month*1,post.date*1);
        initDic.home=post.home;
        initDic.team=post.team;
        initDic.joinDate=post.joinDate;
        initDic.specialInfo=post.specialInfo;
        console.log(initDic);
        fs.readFile(`data/members/members.json`,'utf-8', (err, data)=>{
            let Jmembers=JSON.parse(data);
            Jmembers.push(initDic);
            let Jmembers_string=JSON.stringify(Jmembers);
            fs.writeFile(`data/members/members.json`,Jmembers_string, (err)=>{
                //
                //여기다가.. 데이터수정을 해야해
                //
                //
                res.writeHead(302, {Location:'/thisweek?team='+qTeam+'&week='+qweek});
                res.end();
            });
        });
    });
});



app.get('/weekResult', (req,res)=>{
    fs.readFile('data/members/teams.json','utf-8',(err,data)=>{
        let teams=JSON.parse(data);
        
        let _countWeek=cal.countWeek(Date())
        let weekNo=sf("{year:0000}.{month:00}_{weekNo}",_countWeek); //날짜서식 정리
        let weekly_data=fs.readFileSync(`data/weekly/${weekNo}.json`,'utf-8');
        let weekly=JSON.parse(weekly_data);
        
        let dirs=fs.readdirSync('data/weekly');
        
        //initial 세팅하기
        let teamList=[];
        let result_count={};
        let initialResult={
            'total':0,
            'attendance':0,
            'tardy':0,
            'longAbsentee':0,
            'bibleRead':0,
            'bibleMemorise':0,
        };
        //결과 집계하기
        for(let i=0; i<teams.length;i++){
            teamList.push(teams[i].teamName);
            result_count[teamList[i]]=JSON.parse(JSON.stringify(initialResult));
        }
        for(let i=0; i<teamList.length;i++){
            let teamMems=weekly[teamList[i]];
            result_count[teamList[i]].total=teamMems.length;
            for(let j=0;j<teamMems.length;j++){ 
                if(teamMems[j].attendance===1){ result_count[teamList[i]].attendance+=1
                } else if(teamMems[j].attendance===2){ result_count[teamList[i]].tardy+=1};
                if(teamMems[j].longAbsentee){result_count[teamList[i]].longAbsentee+=1};
                result_count[teamList[i]].bibleRead+=teamMems[j].bibleRead;
                if(teamMems[j].bibleMemorise){result_count[teamList[i]].bibleMemorise+=1};
            };
        };
        console.log(result_count);
        
        calRank(result_count,teamList,(rank, totalPoint)=>{
            console.log(rank)
            console.log
            res.render('basetemp',{
                'loadPage': 'weekly',
                'mainDiv':'result',
                'teams':teamList,
                'rank':rank, 
                'totalPoint':totalPoint,
                'week':weekNo, //필수 query
                'dirs':dirs
            });
        });
    });
});


app.listen(3000, function(){
    console.log('Conneted 3000 port!');
});