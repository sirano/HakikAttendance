var http = require('http');
var fs = require('fs');
var url= require('url'); //http, fs, url 모듈 사용 선언
var qs = require('querystring');
var express = require('express');

/*
입력창
-조 선택
-출석부, 인원

계산계산
결과창
상세보기


__메인메뉴__
- 메인화면
v 조 선택
    - 오늘날짜 선택하기

__입력창__
v 출첵,공과창 전환하기
v 팀별로 기록할수 있도록
    출력 : url에서 특정 조를 표현->pug에서 처리
    입력 : 해당 조 전달->app.js에서 해당 조 정보 수정
v 주차별 기록
    read,writeFile 경로 달라짐
    
    __week__
    v weekly 디렉토리 목록 뽑기
    - 3개이상 ...처리
    -...누르면? 남은목록들 어떻게 보여주지?
    __출석__
    v 출석,공과 입력&저장 매커니즘 만들기
    - 장결자: weekly에 있으면 안됨. members에 있어야 함
    v New Member 버튼 
    -리팩토라이징
    __공과__
    v매커니즘 만들기, 저장
    
__결과창__
__기타__
    __뉴멤버__
    __특이사항__
    __중요사항weekly__
    
__디자인__
__데이터__
-매주 이니셜파일 생성하기
-json?? mySQL이 뭔지 알아야하지 않ㅇ르까?


*/

var app = express();
app.locals.pretty=true;    //전송하는 코드를 '보기 이쁘게' 바뀌줌

app.set('view engine','pug');  //템플릿 엔진으로 pug 사용
app.set('views','./views')    // pug파일들은 ./views에 있다

app.get('/',(req,res)=>{
    fs.readFile('data/members/teams.json','utf-8',(err,data)=>{
        let teams=JSON.parse(data);
        console.log(teams);
        res.render('home',{
            'week':'2020.03_2', //자동으로 현재 주차 나오도록
            'teams':teams
        });
    });
});

// /thisweek?menu=attendance&team=teamA
app.get('/thisweek', function(req,res){
    var _url = req.url;
    var pathName = url.parse(_url, true).pathname;
    let queryData=url.parse(_url,true).query;
    let qweek=queryData.week;
    fs.readdir('data/weekly', (err, dirs) => {
        fs.readFile(`data/weekly/${qweek}.json`,'utf-8', (err, data)=>{
            let weekly=JSON.parse(data);
            res.render('temp', {
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
                res.writeHead(302, {Location:'/thisweek?menu=attendance&team='+qTeam+'&week='+qweek});
                res.end();
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
                res.writeHead(302, {Location:'/thisweek?menu=attendance&team='+qTeam+'&week='+qweek});
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
                res.writeHead(302, {Location:'/thisweek?menu=study&team='+qTeam+'&week='+qweek});
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
                res.writeHead(302, {Location:'/thisweek?menu=study&team='+qTeam+'&week='+qweek});
                res.end();
            });
        });
    }else{
        res.writeHead(200);
        res.end('error');
    };
});

app.listen(3000, function(){
    console.log('Conneted 3000 port!');
});