let as=require('async');

function asyncBlackBeanTimer (seconds){
    console.log('짜장면 배달');
    
    setTimeout(
        function() {
            console.log("식사 완료");
        },
        seconds*1000
    );
    
    console.log("배달부 떠남")
};

asyncBlackBeanTimer(1);

function asyncBlackBeanEaters (name){
    console.log(1)
};


as.waterfall([
    function(callback){
        // if(err){callback('실패1');};
        callback(null, '성공1', '1');
    },
    function(arg1,arg2, callback){
        // if(err){callback('실패2');};
        console.log(arg1,arg2);    //성공1 1
        callback(null, '성공2');
    },
    function(arg1, callback){
        // if(err){callback('실패3');};
        console.log(arg1);        //성공2
        callback(null, '성공3');
    }],
    function(err,result){
        if(err){console.log(err);};
        console.log(result);    //성공3
});




as.series([ //and parallel
    function(callback){
        // if(err){callback('실패1');};
        callback(null, '성공1', '1');
    },
    function(callback){
        // if(err){callback('실패2');};
        callback(null, '성공2');
    },
    function(callback){
        // if(err){callback('실패3');};
        callback(null, '성공3');
    }],
    function(err,result){
        if(err){console.log(err);};
        console.log(result);    //[ [ '성공1', '1' ], '성공2', '성공3' ]
});



let funcName = (arg1,arg2, callback)=> {
    //...
    //...
    callback(result1,result2)
};

funcName(arg1,arg2, (result1,result2)=>{
    
});

