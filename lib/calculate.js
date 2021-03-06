var sf = require("sf"); //문자열 서식 관련. 참고 : https://jsdev.kr/t/js-string/747


var dbW = require('./dbWorks');

exports.countWeek=(dateFormat)=> {
    const inputDate = new Date(dateFormat);

    // 인풋의 년, 월
    let year = inputDate.getFullYear();
    let month = inputDate.getMonth() + 1;

    // 목요일 기준 주차 구하기
    const weekNumberByThurFnc = paramDate => {
        const year = paramDate.getFullYear();
        const month = paramDate.getMonth();
        const date = paramDate.getDate();

        // 인풋한 달의 첫 날과 마지막 날의 요일
        const firstDate = new Date(year, month, 1);
        const lastDate = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDate.getDay() === 0 ? 7 : firstDate.getDay();
        const lastDayOfweek = lastDate.getDay();

        // 인풋한 달의 마지막 일
        const lastDay = lastDate.getDate();

        // 첫 날의 요일이 금, 토, 일요일 이라면 true
        const firstWeekCheck = firstDayOfWeek === 5 || firstDayOfWeek === 6 || firstDayOfWeek === 7;
        // 마지막 날의 요일이 월, 화, 수라면 true
        const lastWeekCheck = lastDayOfweek === 1 || lastDayOfweek === 2 || lastDayOfweek === 3;

        // 해당 달이 총 몇주까지 있는지
        const lastWeekNo = Math.ceil((firstDayOfWeek - 1 + lastDay) / 7);

        // 날짜 기준으로 몇주차 인지
        let weekNo = Math.ceil((firstDayOfWeek - 1 + date) / 7);

        // 인풋한 날짜가 첫 주에 있고 첫 날이 월, 화, 수로 시작한다면 'prev'(전달 마지막 주)
        if (weekNo === 1 && firstWeekCheck) weekNo = 'prev';
        else if (weekNo === lastWeekNo && lastWeekCheck)
            // 인풋한 날짜가 마지막 주에 있고 마지막 날이 월, 화, 수로 끝난다면 'next'(다음달 첫 주)
            weekNo = 'next';
        else if (firstWeekCheck)
            // 인풋한 날짜의 첫 주는 아니지만 첫날이 월, 화 수로 시작하면 -1;
            weekNo = weekNo - 1;

        return weekNo;
    };

    // 목요일 기준의 주차
    let weekNo = weekNumberByThurFnc(inputDate);

    // 이전달의 마지막 주차일 떄
    if (weekNo === 'prev') {
        // 이전 달의 마지막날
        const afterDate = new Date(year, month - 1, 0);
        year = month === 1 ? year - 1 : year;
        month = month === 1 ? 12 : month - 1;
        weekNo = weekNumberByThurFnc(afterDate);
    }
    // 다음달의 첫 주차일 때
    if (weekNo === 'next') {
        year = month === 12 ? year + 1 : year;
        month = month === 12 ? 1 : month + 1;
        weekNo = 1;
    }
    
    let weekNo_float=sf("{year:0000}{month:00}.{weekNo}",{ year, month, weekNo })*1;

    return weekNo_float;
}

exports.rankByPoint=(data, orderBy, rankName)=>{
    let sortByPoint=data.sort(function (a,b){
        return b[orderBy] - a[orderBy]
    });
    let recentRankNum=1;
    for(let i=0; i<data.length;i++){
        if(i===0) data[i][rankName]=i+1;
        else{
            if(data[i][orderBy]===data[i-1][orderBy]){
                data[i][rankName]=recentRankNum;
                
            }else{
                data[i][rankName]=i+1;
                recentRankNum=i+1;
            };
        };
    };
    return data;
};

exports.totalRank = (data)=>{
    
    ///여기부터 고칠차례!!
    
    
    for(let i=0; i<data.length;i++){
        data[i].totalPoint = (data.length +1 - data[i].atRank)*2 
            + (data.length +1 - data[i].readRank) 
            + (data.length +1 - data[i].memoRank) 
            + data[i].adPoint;
    }
    
    data.sort(function (a,b){
        return b.totalPoint - a.totalPoint
    });
    
    let recentRankNum=1;
    for(let i=0; i<data.length;i++){
        if(i===0) data[i].totalRank=i+1;
        else{
            if(data[i].totalPoint===data[i-1].totalPoint){
                data[i].totalRank=recentRankNum;
                
            }else{
                data[i].totalRank=i+1;
                recentRankNum=i+1;
            };
        };
    };
    
    return data;
}