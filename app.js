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
- 조 선택

__입력창__
v 출첵,공과창 전환하기

    __출석__
    v 출석,공과 입력&저장 매커니즘 만들기
    - 장결자: weekly에 있으면 안됨. members에 있어야 함
    -New Member 버튼 
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


*/

var app = express();
app.locals.pretty=true;    //전송하는 코드를 '보기 이쁘게' 바뀌줌

app.set('view engine','pug');  //템플릿 엔진으로 pug 사용
app.set('views','./views')    // pug파일들은 ./views에 있다


//
app.get('/thisweek', function(req,res){
    var _url = req.url;
    var pathName = url.parse(_url, true).pathname;
    let queryData=url.parse(_url,true).query;
    fs.readFile('data/weekly/2020.3_2.json','utf-8', (err, data)=>{
        let weekly=JSON.parse(data);
        res.render('temp', {'weekly':weekly, 'mainDiv':queryData.menu}) //temp 라는 템플릿파일 렌더링해서 전송. {} 안에 dict로 변수들 전송
    })
});

app.get('/thisweek_process', function(req,res){
    var _url = req.url;
    var pathName = url.parse(_url, true).pathname;
    let queryData=url.parse(_url,true).query;
    let qType=queryData.type;
    let qName=queryData.name;
    
    if(qType==='longAbsentee'){
        fs.readFile('data/weekly/2020.3_2.json','utf-8',(err,dict)=>{
            console.log(dict);
            let Jdict=JSON.parse(dict);
            let searchNum=-1;
            let teamList=Jdict.teamA; //나중에 조별 수정할때 사용!
            for (let i=0;i<teamList.length;i++){ //좀더 나은 정렬방법??
                if(teamList[i].name===qName){
                    searchNum=i;
                }
            };
            teamList[searchNum][qType]= teamList[searchNum][qType]? false:true;
            console.log(Jdict)
            let Jdict_string=JSON.stringify(Jdict);
            fs.writeFile('data/weekly/2020.3_2.json',Jdict_string, (err)=>{
                res.writeHead(302, {Location:'/thisweek?menu=attendance'});
                res.end();
            });
        });
    }else if(qType==='attendance'){
        fs.readFile('data/weekly/2020.3_2.json','utf-8',(err,dict)=>{
            console.log(dict);
            let Jdict=JSON.parse(dict);
            let searchNum=-1;
            let teamList=Jdict.teamA; //나중에 조별 수정할때 사용!
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
            fs.writeFile('data/weekly/2020.3_2.json',Jdict_string, (err)=>{
                res.writeHead(302, {Location:'/thisweek?menu=attendance'});
                res.end();
            });
        });
    }else if(qType==='bibleRead'){
        fs.readFile('data/weekly/2020.3_2.json','utf-8',(err,dict)=>{
            console.log(dict);
            let Jdict=JSON.parse(dict);
            let searchNum=-1;
            let teamList=Jdict.teamA; //나중에 조별 수정할때 사용!
            for (let i=0;i<teamList.length;i++){ //좀더 나은 정렬방법??
                if(teamList[i].name===qName){
                    searchNum=i;
                }
            };
            teamList[searchNum][qType]++;
            console.log(Jdict)
            let Jdict_string=JSON.stringify(Jdict);
            fs.writeFile('data/weekly/2020.3_2.json',Jdict_string, (err)=>{
                res.writeHead(302, {Location:'/thisweek?menu=study'});
                res.end();
            });
        });
    }else if(qType==='bibleMemorise'){
        fs.readFile('data/weekly/2020.3_2.json','utf-8',(err,dict)=>{
            console.log(dict);
            let Jdict=JSON.parse(dict);
            let searchNum=-1;
            let teamList=Jdict.teamA; //나중에 조별 수정할때 사용!
            for (let i=0;i<teamList.length;i++){ //좀더 나은 정렬방법??
                if(teamList[i].name===qName){
                    searchNum=i;
                }
            };
            teamList[searchNum][qType]= teamList[searchNum][qType]? false:true;
            console.log(Jdict)
            let Jdict_string=JSON.stringify(Jdict);
            fs.writeFile('data/weekly/2020.3_2.json',Jdict_string, (err)=>{
                res.writeHead(302, {Location:'/thisweek?menu=study'});
                res.end();
            });
        });
    }else{
        res.writeHead(200);
        res.end('error');
    };
    //res.writeHead(302, {Location:'/thisweek'});
    // res.end();
});

app.listen(3000, function(){
    console.log('Conneted 3000 port!');
});