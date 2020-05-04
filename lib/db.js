var mysql = require('mysql');
var db = mysql.createConnection({
    host: 'localhost',
    user: 'ray',
    password: 'ph.dyhc0521',
    database: 'Members'
});
db.connect();

module.exports=db;