
function changeAt(self,week){
    let _week=week;
    let hidden=document.querySelector(`input[name=AT_${self.id}]`);
    let hidden_value=0;
    if(self.value==='출석'){
        self.value='지각';
        self.className='btn btn-yellow';
        hidden_value=2;
    }else if(self.value==='지각'){
        self.value='결석';
        self.className='btn btn-red';
        hidden_value=3;
    }else{ // 결석 또는 undefined
        self.value='출석';
        self.className='btn btn-blue';
        hidden_value=1;
    }
    hidden.value=hidden_value;
    console.log(hidden);

    updateSQL(self,hidden_value,_week);
};

function changeRead(self, week){
    if(self.value>0){
        self.className='btn btn-yellow';
    }else{
        self.className='btn btn-secondary';
    }
    updateSQL(self,self.value,week);
}

function changeMemo(self, week){
    let hidden=document.querySelector(`input[name=BM_${self.id}]`);
    let hidden_value=0;
    if(self.value==='암송완료'){
        self.value='암송아직';
        self.className='btn btn-light';
        hidden_value=0;
    }else{ // 암송아직 또는 undefined
        self.value='암송완료';
        self.className='btn btn-blue';
        hidden_value=1;
    }
    hidden.value=hidden_value;
    console.log(hidden);
    updateSQL(self,hidden_value,week);

}

function specialInfo(self,week){
    let mem_id=self.id;
    let _week=week
    location.href=`/specialInfo?mem_id=${mem_id}&week=${_week}`
};

function newMember(self, team,week){
    let myTeam=team;
    let _week=week;
    location.href=`/newMember?team=${myTeam}&week=${_week}`
};



function updateSQL(self, _value, _week){
    $.ajax({
        url: '/weekly_callback' ,// 요청 할 주소
        async: true, // false 일 경우 동기 요청으로 변경
        type: 'POST' ,// GET, PUT
        data: {
            type: self.name,
            mem_id: self.id,
            value: _value,
            week: _week
        }, // 전송할 데이터
        dataType: 'json', // xml, json, script, html
        success: function(result) {
            console.log("mysql message : "+result.message);
        }, // 요청 완료 시
        error: function(result) {
            alert('데이터베이스를 수정하지 못했습니다!');
            console.log(result);
        }, // 요청 실패.
    });  
};

function longAb(self, team, week){
    // let type=self.name;
    let mem_id=self.id;
    // let myTeam=team;
    let _week=week;
    // //location.href=`/thisweek_process?type=${type}&team=${myTeam}&week=${_week}&mem_id=${mem_id}`;
    let _value=0;
    if(self.value==='정상'){
        _value=1;
        self.value='장기결석';
        self.className='btn btn-secondary';
        self.closest('.form-row').querySelector('input[name=attendance]').value='체크안함';
        self.closest('.form-row').querySelector('input[name=attendance]').className='btn btn-secondary';

        let target_input=self.closest('.form-row').querySelectorAll('input');
        for(let i=0; i<target_input.length-2 ;i++){
            target_input[i].disabled=true;
        };
    }else{
        _value=0;
        self.value='정상';
        self.className='btn btn-light';
        self.closest('.form-row').querySelector('input[name=attendance]').value='체크안함';
        self.closest('.form-row').querySelector('input[name=attendance]').className='btn btn-secondary';

        let target_input=self.closest('.form-row').querySelectorAll('input');
        for(let i=0; i<target_input.length-2 ;i++){
            target_input[i].disabled=false;
        };
    }
    
    
    $.ajax({
        url: '/longAb_callback' ,// 요청 할 주소
        async: true, // false 일 경우 동기 요청으로 변경
        type: 'POST' ,// GET, PUT
        data: {
            mem_id: self.id,
            value: _value,
            week: _week
        }, // 전송할 데이터
        dataType: 'json', // xml, json, script, html
        success: function(result) {
            console.log(result);
            console.log("mysql message(members) : "+result[0].message);
            console.log("mysql message(weekly) : "+result[1].message);
        }, // 요청 완료 시
        error: function(result) {
            alert('데이터베이스를 수정하지 못했습니다!');
            console.log(result[0], result[1]);
        }, // 요청 실패.
    });  
    
};

//처음 로드했을때, 장기결석인애들 비활성화
let target_longAB = document.querySelectorAll('input[name=longAbsentee]');
console.log(target_longAB);
for(let i=0; i<target_longAB.length;i++){
    if(target_longAB[i].value==='장기결석'){
        let unable_id=target_longAB[i].id
        // document.querySelectorAll('.form-row')[i].querySelector('input[name=attendance]').value='결석';
        // document.querySelectorAll('.form-row')[i].querySelector('input[name=attendance]').className='btn btn-red';

        let target_input=document.querySelectorAll('.form-row')[i].querySelectorAll('input');
        for(let i=0; i<target_input.length-2 ;i++){
            target_input[i].disabled=true;
        };
    };
};

function adPoints_del(self){
    let adPoints_id=self.closest('.row').id
    self.closest('.row').style.display='none';
    $.ajax({
        url: '/adPoints_callback' ,// 요청 할 주소
        async: true, // false 일 경우 동기 요청으로 변경
        type: 'POST' ,// GET, PUT
        data: {
            type: 'delete',
            adPoints_id: adPoints_id
        }, // 전송할 데이터
        dataType: 'json', // xml, json, script, html
        success: function(result) {
            console.log("deleted!!");
        }, // 요청 완료 시
        error: function(result) {
            alert('데이터베이스를 수정하지 못했습니다!');
            console.log(result);
        }, // 요청 실패.
    });  
};

function adPoints_create(self,week,team){
    let inputs = self.closest('form').querySelector('.form-row').querySelectorAll('input');
    if(!inputs[0].value) alert('추가점수를 입력하세요')
    else if(!inputs[1].value) alert('추가점수 사유를 입력하세요')
    else{
        $.ajax({
            url: '/adPoints_callback' ,// 요청 할 주소
            async: true, // false 일 경우 동기 요청으로 변경
            type: 'POST' ,// GET, PUT
            data: {
                type:"create",
                week: week,
                team_id : team,
                point : inputs[0].value,
                reason : inputs[1].value
            }, // 전송할 데이터
            dataType: 'json', // xml, json, script, html
            success: function(result) {
                console.log("completed!!");
            }, // 요청 완료 시
            error: function(result) {
                alert('데이터베이스를 수정하지 못했습니다!');
                console.log(result);
            }, // 요청 실패.
        });  
    }
        
};


/*
submit
-> ajax 전송
-> db.query(`INSERT INTO adPoints (week,team_id,point,reason) VALUES (?,?,?,?);` , [] , ()=>{})

Delete
->ajax 전송
-> db.query(`DELETE FROM adPoints WHERE id=?`, [] , ()=>{})*/