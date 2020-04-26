// #{week} 싹다 고쳐야함!! ㅜㅜㅜㅜ

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

    function longAb(self, team, week){
    let type=self.name;
    let mem_id=self.id;
    let myTeam=team;
    let _week=week;
    location.href=`/thisweek_process?type=${type}&team=${myTeam}&week=${_week}&mem_id=${mem_id}`;
};

function moreInfo(self,week){
    let mem_id=self.id;
    let _week=week
    location.href=`/moreInfo?mem_id=${mem_id}&week=${_week}`
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