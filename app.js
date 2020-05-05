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

// 분야별 등수 세우기
// 총점수
// 총등수
function calRank(result_count, teamList, callbackFunc) {
    let atPoint = [];
    let readPoint = [];
    let memoPoint = [];
    let totalPoint = [];
    let rule = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 };

    for (let i = 0; i < teamList.length; i++) {
        let initPoint = 0;
        initPoint += result_count[teamList[i]].attendance * 10;
        initPoint += result_count[teamList[i]].tardy * 5;
        initPoint +=
            (result_count[teamList[i]].total -
                result_count[teamList[i]].longAbsentee -
                result_count[teamList[i]].attendance) *
            -2;
        initPoint /= result_count[teamList[i]].total - result_count[teamList[i]].longAbsentee;
        atPoint.push(initPoint);

        initPoint = 0;
        initPoint += result_count[teamList[i]].bibleRead;
        initPoint /= result_count[teamList[i]].attendance + result_count[teamList[i]].tardy;
        readPoint.push(initPoint);

        initPoint = 0;
        initPoint += result_count[teamList[i]].bibleMemorise;
        initPoint /= result_count[teamList[i]].attendance + result_count[teamList[i]].tardy;
        memoPoint.push(initPoint);
    }
    console.log(atPoint, readPoint, memoPoint);

    function getRanks(arr) {
        var sorted = arr.slice().sort(function(a, b) {
            return b - a;
        });
        return arr.slice().map(function(v) {
            return sorted.indexOf(v) + 1;
        });
    }
    let rank = {};
    rank.at = getRanks(atPoint);
    rank.read = getRanks(readPoint);
    rank.memo = getRanks(memoPoint);
    console.log(rank);
    for (let i = 0; i < teamList.length; i++) {
        totalPoint.push(rule[rank.at[i]] * 2 + rule[rank.read[i]] + rule[rank.memo[i]]);
    }
    console.log(totalPoint);
    rank.final = getRanks(totalPoint);
    callbackFunc(rank, totalPoint);
}

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
    let teamsBeforeParse = fs.readFileSync('data/members/teams.json', 'utf-8'); //조 이름, 조별 정보 불러오기
    let teams = JSON.parse(teamsBeforeParse);
    res.render('basetemp', {
        loadPage: 'newMember',
        teams: teams, //조별정보
        team: qTeam,
        week: qweek
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
        console.log(qweek);
        let Nname = post.name;
        let initDic = {
            name: '',
            phoneNumber: '',
            home: '',
            brithday: '',
            team: '',
            joinDate: '',
            longAbsentee: false,
            specialInfo: ''
        };
        initDic.name = post.name;
        initDic.phoneNumber = post.phoneNumber;
        initDic.birthday = sf(
            '{0:0000}.{1:00}.{2:00}',
            post.year * 1,
            post.month * 1,
            post.date * 1
        );
        initDic.home = post.home;
        initDic.team = post.team;
        initDic.joinDate = post.joinDate;
        initDic.specialInfo = post.specialInfo;
        console.log(initDic);
        fs.readFile(`data/members/members.json`, 'utf-8', (err, data) => {
            let Jmembers = JSON.parse(data);
            Jmembers.push(initDic);
            let Jmembers_string = JSON.stringify(Jmembers);
            fs.writeFile(`data/members/members.json`, Jmembers_string, err => {
                //
                //여기다가.. 데이터수정을 해야해
                //
                //
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
    
app.get('/#', (req, res) => {
    fs.readFile('data/members/teams.json', 'utf-8', (err, data) => {
        let teams = JSON.parse(data);

        let _countWeek = cal.countWeek(Date());
        let weekNo = sf('{year:0000}.{month:00}_{weekNo}', _countWeek); //날짜서식 정리
        let weekly_data = fs.readFileSync(`data/weekly/${weekNo}.json`, 'utf-8');
        let weekly = JSON.parse(weekly_data);

        let dirs = fs.readdirSync('data/weekly');

        //initial 세팅하기
        let teamList = [];
        let result_count = {};
        let initialResult = {
            total: 0,
            attendance: 0,
            tardy: 0,
            longAbsentee: 0,
            bibleRead: 0,
            bibleMemorise: 0
        };
        //결과 집계하기
        for (let i = 0; i < teams.length; i++) {
            teamList.push(teams[i].teamName);
            result_count[teamList[i]] = JSON.parse(JSON.stringify(initialResult));
        }
        for (let i = 0; i < teamList.length; i++) {
            let teamMems = weekly[teamList[i]];
            result_count[teamList[i]].total = teamMems.length;
            for (let j = 0; j < teamMems.length; j++) {
                if (teamMems[j].attendance === 1) {
                    result_count[teamList[i]].attendance += 1;
                } else if (teamMems[j].attendance === 2) {
                    result_count[teamList[i]].tardy += 1;
                }
                if (teamMems[j].longAbsentee) {
                    result_count[teamList[i]].longAbsentee += 1;
                }
                result_count[teamList[i]].bibleRead += teamMems[j].bibleRead;
                if (teamMems[j].bibleMemorise) {
                    result_count[teamList[i]].bibleMemorise += 1;
                }
            }
        }
        console.log(result_count);

        calRank(result_count, teamList, (rank, totalPoint) => {
            console.log(rank);
            console.log;
            res.render('basetemp', {
                loadPage: 'weekly',
                mainDiv: 'result',
                teams: teamList,
                rank: rank,
                totalPoint: totalPoint,
                week: weekNo, //필수 query
                dirs: dirs
            });
        });
    });
});

app.listen(3000, function() {
    console.log('Conneted 3000 port!');
});