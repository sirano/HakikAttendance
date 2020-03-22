var http = require('http');
var fs = require('fs');
var url= require('url'); //http, fs, url 모듈 사용 선언
var qs = require('querystring');
var express = require('express');
var sf = require("sf"); //문자열 서식 관련. 참고 : https://jsdev.kr/t/js-string/747

const date=require('./dateFunctions.js');


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
    v 오늘날짜 선택하기

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
        -등록후 해당주차에 추가
    v __특이사항__
    v __중요사항weekly__
    
__디자인__
__데이터__
-json?? mySQL이 뭔지 알아야하지 않ㅇ르까?
v 매주 이니셜파일 생성하기!!!!!!!
    -홈을 실행시켰을때
    -해당주차 파일이 있는지 없는지 확인한다
    -만약없다면 만든다
    -teams를 읽는다 -> initial 데이터 만든다
    -members를 읽는다 -> 해당팀에 집어넣는다 ->initial 정보를 넣는다


___에러___
- 2020년 3월 20일. 4주차인데 3주차라고 뜬다. dateFunctions 모듈 다시 살펴보기
    + Date() 결과물이 GMT로 나옴. KST로 바꾸는방법?

*/

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
        "bibleMemorise": false
    };
    let initialInfos_copy=''
    for(let i=0; i<teams.length;i++){
        initialWeekly[teams[i].teamName]=[];
    };
    fs.readFile('data/members/members.json','utf-8',(err,data2)=>{
        let members=JSON.parse(data2);
        for(let j=0;j<members.length;j++){
            let herTeam=members[j].team;
            initialInfos.name=members[j].name;
            initialInfos_copy=JSON.parse(JSON.stringify(initialInfos)); //딕셔너리인 Infos를 문자열 Infos_copy로 바꾸어 깊은 복사!
            initialWeekly[herTeam].push(initialInfos_copy);
        };
        let initialWeekly_string=JSON.stringify(initialWeekly);
        fs.writeFile(`data/weekly/${weekNo}.json`, initialWeekly_string, (err)=>{
            callbackFunc();
        });
    });
}




app.get('/',(req,res)=>{
    fs.readFile('data/members/teams.json','utf-8',(err,data)=>{
        fs.readdir('data/weekly', (err, dirs) => {
            let teams=JSON.parse(data);
            let _countWeek=date.countWeek(Date())
            let weekNo=sf("{year:0000}.{month:00}_{weekNo}",_countWeek); //날짜서식 정리
            console.log(weekNo);
            console.log(dirs.indexOf(weekNo+'.json'));  //-1이면 없음, 나머지는 있음
            if(dirs.indexOf(weekNo+'.json')===-1){ //dirs에 이번주 파일이 없다면?
                
                makeNewWeekly(teams,weekNo, ()=>{
                    res.writeHead(302, {Location:'/'});
                    res.end();
                });
            }else{
                res.render('home',{
                    'week': weekNo, //자동으로 현재 주차 나오도록
                    'teams':teams
                });
            };
            
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

app.get('/newMember', (req,res)=>{
    var _url = req.url;
    let queryData=url.parse(_url,true).query;
    let qTeam=queryData.team;
    let qweek=queryData.week
    res.render('newMember',{'team':qTeam, 'week':qweek});
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
                res.writeHead(302, {Location:'/thisweek?menu=attendance&team='+qTeam+'&week='+qweek});
                res.end();
            });
        });
    });
});


app.listen(3000, function(){
    console.log('Conneted 3000 port!');
});