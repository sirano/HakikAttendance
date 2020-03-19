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

*/

var app = express();
app.locals.pretty=true;    //전송하는 코드를 '보기 이쁘게' 바뀌줌

app.set('view engine','pug');  //템플릿 엔진으로 pug 사용
app.set('views','./views')    // pug파일들은 ./views에 있다


//
app.get('/thisweek', function(req,res){
    fs.readFile('data/weekly/2020.3_2.json','utf-8', (err, data)=>{
        let weekly=JSON.parse(data);
        res.render('temp', {'weekly':weekly}) //temp 라는 템플릿파일 렌더링해서 전송. {} 안에 dict로 변수들 전송
    })
});

app.listen(3000, function(){
    console.log('Conneted 3000 port!');
});