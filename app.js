var http = require('http');
var fs = require('fs');
var url = require('url'); //http, fs, url 모듈 사용 선언
var qs = require('querystring');
var express = require('express');
var mysql = require('mysql');
let as = require('async');

const cal = require('./lib/calculate.js');
var db = require('./lib/db');
var dbW = require('./lib/dbWorks');

var app = express();
app.locals.pretty = true; //전송하는 코드를 '보기 이쁘게' 바뀌줌

app.set('view engine', 'pug'); //템플릿 엔진으로 pug 사용
app.set('views', './views'); // pug파일들은 ./views에 있다

// SELECT members.id,name,longAbsentee,team_id,weekly.id,week, mem_id, attendance, bibleRead,bibleMemorise FROM members LEFT JOIN weekly ON members.id=weekly.mem_id;
// SELECT members.id,name,longAbsentee,team_id,weekly.id,week, mem_id FROM members LEFT JOIN weekly ON members.id=weekly.mem_id;
// DELETE FROM weekly WHERE week=202004.3;
// SELECT name,mem_id,team_id,week,longAbsentee, attendance, bibleRead,bibleMemorise FROM members LEFT JOIN weekly ON members.id=weekly.mem_id
// UPDATE weekly SET attendance=1 WHERE week=? and mem_id=?;

app.use(express.static('views')); //img 등 데이터 불러오기 위함

app.get('/', (req, res) => {
    let weekNo = cal.countWeek(Date()); //날짜서식 정리
    
    db.query('SELECT id,teamName,teacher,photo FROM teams',(err,teams)=>{
        
        res.render('basetemp', {
            loadPage: 'home',
            week: weekNo, //자동으로 현재 주차 나오도록
            teams: teams
        });
        //렌더링 후, weekly 데이터 업데이트하기 만들기
        dbW.updateEachMembers(weekNo);
    });
});

// /thisweek?menu=attendance&team=teamA
app.get('/thisweek', function(req, res) {
    var _url = req.url;
    var pathName = url.parse(_url, true).pathname;
    let queryData = url.parse(_url, true).query;
    let qteam = queryData.team;
    let qweek = queryData.week*1;
    
    dbW.updateEachMembers(qweek); //데이터 업데이트
    
    //select * from weekly WHERE mem_id=1 ORDER BY week DESC LIMIT 6;
    
    db.query('SELECT id,teamName,teacher,photo FROM teams',(err,teams)=>{      
        dbW.loadWeeksList('SELECT DISTINCT week FROM weekly','week',(weeks) => { //weeks = [ 202004.2, 202004.3, ... ]            
            db.query(`SELECT name,mem_id,team_id,week,longAbsentee, attendance, bibleRead,bibleMemorise 
                    FROM members LEFT JOIN weekly ON members.id=weekly.mem_id
                    WHERE team_id=? and week=?`,[qteam,qweek],(err,weekly)=>{ //해당주,우리팀 출석정보
                
                db.query(`SELECT * FROM adPoints WHERE team_id=? and week=?`,
                         [qteam,qweek],(err,adPoints)=>{
                    
                    console.log(adPoints);
                    
                    res.render('basetemp', {
                        loadPage: 'weekly',
                        mainDiv: queryData.menu,
                        team: queryData.team, // 필수 query
                        week: queryData.week, // 필수 query
                        teams: teams,         // 조별정보
                        weekly: weekly,       // 해당주, 우리팀 출석정보
                        dirs: weeks,            // 이전 주차 리스트
                        adPoints: adPoints    //추가점수(해당주,우리팀)
                    }); //temp 라는 템플릿파일 렌더링해서 전송. {} 안에 dit로 변수들 전송
                });   
            });
        });
    });
});



    
app.post('/weekly_callback',function(req,res){
    var body = '';
    req.on('data', function(data) {
        body += data;
        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) req.connection.destroy();
    });
    req.on('end', function(data) {
        var post = qs.parse(body); //body json 형식으로 변환
        console.log(post);
        
        
        db.query(`UPDATE weekly SET ${post.type}=? WHERE week=? and mem_id=?;`,
            [post.value*1 , post.week*1, post.mem_id*1 ],
            (err,result)=>{ 
            if(err) console.log(err);
            res.send(result); 
        });
    });

       
});

app.post('/longAb_callback',function(req,res){
    var body = '';
    req.on('data', function(data) {
        body += data;
        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) req.connection.destroy();
    });
    req.on('end', function(data) {
        var post = qs.parse(body); //body json 형식으로 변환
        console.log(post);
        //members->장기결석 1
        //weekly 이번주 출석3 성경0 암송0;
        db.query(`UPDATE members SET longAbsentee=?  WHERE id=?`,
                 [post.value*1, post.mem_id*1],(err,result1)=>{ 
            db.query(`UPDATE weekly SET attendance=0, bibleRead=0, bibleMemorise=0 WHERE week=? and mem_id=?;`,
                [ post.week*1, post.mem_id*1 ],
                (err,result2)=>{ 
                if(err) console.log(err);
                res.send([result1, result2]); 
            });
        });
    });
});

app.post('/adPoints_callback',function(req,res){
    var body = '';
    req.on('data', function(data) {
        body += data;
        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) req.connection.destroy();
    });
    req.on('end', function(data) {
        var post = qs.parse(body); //body json 형식으로 변환
        console.log(post);
        
        if(post.type==='create'){
            db.query(`INSERT INTO adPoints (week,team_id,point,reason) VALUES (?,?,?,?);` ,
                     [ post.week*1,post.team_id*1,post.point*1, post.reason ] , (err,result)=>{
                if(err) console.log(err);
                res.send(result); 
            });
        }else if(post.type==='delete'){
            db.query(`DELETE FROM adPoints WHERE id=?`, [post.adPoints_id*1] , (err,result)=>{
                if(err) console.log(err);
                res.send(result); 
            });
        }else console.log('post.type error');
    });
});


app.get('/newMember', (req, res) => {
    var _url = req.url;
    let queryData = url.parse(_url, true).query;
    let qTeam = queryData.team;
    let qweek = queryData.week;
    
    db.query('SELECT id,teamName,teacher,photo FROM teams',(err,teams)=>{
        let teamName = teams.find(element => element.id===qTeam*1); //team_id = qTeam인 항목 찾아내기
        res.render('basetemp', {
            loadPage: 'newMember',
            teams: teams, //조별정보
            team: qTeam,
            teamName : teamName.teamName,
            week: qweek
        });
    });
});

app.post('/newMember_process', (req, res) => {
    var body = '';
    req.on('data', function(data) {
        body += data;
        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) req.connection.destroy();
    });
    req.on('end', function(data) {
        //더이상 들어올 정보가 없을때 'end' 호출
        var _url = req.url;
        let queryData = url.parse(_url, true).query;
        let qweek = queryData.week;
        let qTeam = queryData.team; //url정보 가져오기

        var post = qs.parse(body); //body json 형식으로 변환
        
        
        let birthday = post.bir_y + '년 '+ post.bir_m + '월 ' + post.bir_d + '일';
        let joined = post.joinDate.substr(0,4) + '년 '+ post.joinDate.substr(4,2) + '월 '+ post.joinDate.substr(7) + '주차';
        db.query(`INSERT INTO members (name, phoneNumber, home, birthday, team_id, joined)
                VALUES (?,?,?,?,?,?)`,[post.name,post.phoneNumber,post.home, birthday,post.team, joined ],(err,result)=>{
            if(err) console.log(err);
            
            console.log(result);
            
            db.query(`INSERT INTO weekly (week,mem_id, attendance) VALUES (?,?,1)`,
                [ post.joinDate*1, result.insertId*1 ],
                (err,result)=>{ 
                if(err) console.log(err);
                
                res.writeHead(302, { Location: '/thisweek?team=' + qTeam + '&week=' + qweek });
                res.end();
            });
        });
    });
});

app.get('/weekResult', (req, res) => {
    var _url = req.url;
    let queryData = url.parse(_url, true).query;
    let qweek = queryData.week*1;
    
    dbW.updateEachMembers(qweek); //데이터 업데이트
    
    db.query('SELECT id,teamName,teacher,photo FROM teams',(err,teams)=>{      
        dbW.loadWeeksList('SELECT DISTINCT week FROM weekly','week',(weeks) => { //weeks = [ 202004.2, 202004.3, ... ]

            
            db.query(`SELECT
                        G1.team_id, G1.week, count_except_lonAb, atPoint, readPoint, memoPoint, 
                        adPoints.point as adPoint
                        FROM (
                        SELECT
                        team_id,week,
                        COUNT(if(longAbsentee=0,1,null))count_except_lonAb, 
                        (COUNT(if(attendance=1,1,null))*10+COUNT(if(attendance=2,1,null))*5+COUNT(if(attendance=1 OR attendance=2,null,1))*(-2))/COUNT(if(longAbsentee=0,1,null))atPoint,
                        SUM(bibleRead)/COUNT(if(longAbsentee=0,1,null))readPoint,
                        SUM(bibleMemorise)/COUNT(if(longAbsentee=0,1,null))memoPoint
                        FROM members LEFT JOIN weekly ON members.id=weekly.mem_id WHERE week=? 
                        GROUP BY team_id
                        )G1 
                        LEFT JOIN adPoints ON G1.team_id=adPoints.team_id and G1.week=adPoints.week`,
                     [qweek],(err,resultData)=>{
                
                resultData = cal.rankByPoint(resultData,'atPoint', 'atRank');
                resultData = cal.rankByPoint(resultData,'readPoint', 'readRank');
                resultData = cal.rankByPoint(resultData,'memoPoint', 'memoRank');
                
                resultData = cal.totalRank(resultData)
                
                resultData.sort(function (a,b){
                    return a.team_id - b.team_id
                });
                
                
                console.table(resultData);
                res.render('basetemp', {
                    loadPage: 'weekly',
                    mainDiv: 'result',
                    week: queryData.week, // 필수 query
                    teams: teams,         // 조별정보
                    result: resultData,       // 해당주, 우리팀 출석정보
                    dirs: weeks,            // 이전 주차 리스트
                }); //temp 라는 템플릿파일 렌더링해서 전송. {} 안에 dit로 변수들 전송
                
            });            
        });
    });
});
    



app.get('/personal', (req,res)=>{
    var _url = req.url;
    var pathName = url.parse(_url, true).pathname;
    let queryData = url.parse(_url, true).query;
    let mem_id = queryData.mem_id;
    let qweek = queryData.week*1;
    
    db.query('SELECT id,teamName,teacher,photo FROM teams',(err,teams)=>{
        db.query(`SELECT members.id AS id, name, phoneNumber, home, birthday, longAbsentee, team_id, teamName 
                FROM members LEFT JOIN teams ON members.team_id=teams.id 
                WHERE members.id=?`, [mem_id],(err,prof)=>{
            db.query(`SELECT id, CONCAT(left(week,4),"년 ",substring(week,5,2),"월 ",right(week,1),"주")week,
                    mem_id, attendance, bibleRead, bibleMemorise 
                    FROM weekly WHERE mem_id=? and week>200000;` , [mem_id],(err,aten)=>{
                db.query(`SELECT mem_id,DATE_FORMAT(created,"%Y년%c월%d일") AS created,title,description,author 
                        FROM specialInfos LEFT JOIN SI_link ON SI_link.SI_id=specialInfos.id 
                        WHERE mem_id=?` , [mem_id],(err,info)=>{
                    
                    
                    // //임시 값 지정
                    // prof[0].birthday='1998.05.21';
                    // prof[0].home = '인천 연수구';
                    // prof[0].phoneNumber = '010-4133-6335'
                    
                    res.render('basetemp', {
                        loadPage: 'personal',
                        week: queryData.week, //자동으로 현재 주차 나오도록
                        teams: teams,
                        profile : prof,
                        attendance : aten,
                        specialInfo : info
                    });
                });
            });
        });      
    });
});

app.get('/students', (req,res)=>{
    let weekNo = cal.countWeek(Date()); //날짜서식 정리
    db.query('SELECT id,teamName,teacher,photo FROM teams',(err,teams)=>{
        db.query(`SELECT members.id AS id, name, phoneNumber, home, birthday, longAbsentee, team_id, teamName 
                FROM members LEFT JOIN teams ON members.team_id=teams.id`,
                (err,prof)=>{
        
            res.render('basetemp', {
                loadPage: 'students',
                week: weekNo, //자동으로 현재 주차 나오도록
                teams: teams,
                profile : prof
            });
        });
    });
});


app.get('/specialInfo', (req,res)=>{
    var _url = req.url;
    let queryData = url.parse(_url, true).query;
    let mem_id = queryData.mem_id;
    let qweek = queryData.week*1;
    db.query('SELECT id,teamName,teacher,photo FROM teams',(err,teams)=>{
        // db.query(`SELECT members.id AS id, name, team_id, teamName 
        //         FROM members LEFT JOIN teams ON members.team_id=teams.id`,
        db.query(`SELECT id AS id, name FROM members `,
                (err,prof)=>{
            res.render('basetemp', {
                loadPage: 'specialInfo',
                week: qweek, //자동으로 현재 주차 나오도록
                teams: teams,
                mem_id : mem_id,
                profile : prof
            });
        });
    });
});

app.post('/specialInfo_process', (req,res)=>{
    var body = '';
    req.on('data', function(data) {
        body += data;
        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) req.connection.destroy();
    });
    req.on('end', function(data) {
        //더이상 들어올 정보가 없을때 'end' 호출
        var _url = req.url;
        let queryData = url.parse(_url, true).query;
        let qweek = queryData.week; //url정보 가져오기

        var post = qs.parse(body); //body json 형식으로 변환
        console.log(post);
        
        
        //
        // <===============여기할차례!!!!=================>
        // <===============여기할차례!!!!=================>
        // <===============여기할차례!!!!=================>
        //
        
        res.writeHead(200);
        res.end('good')
    });
});

app.listen(3000, function() {
    console.log('Conneted 3000 port!');
});