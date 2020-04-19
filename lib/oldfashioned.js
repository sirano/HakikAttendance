//업데이트하면서 더이상 쓰지 않는 함수들의 무덤....ㅜ


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