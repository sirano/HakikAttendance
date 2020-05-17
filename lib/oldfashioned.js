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