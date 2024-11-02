import mysql from 'mysql2';

const db = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'Chaitanya@123',
    database : 'medaccess'
});

db.connect((err)=>
{
    if(err)
    {
        console.error("Error connection to mysql:",err);
        return;
    }
    console.log("Connected to mysql");
});

export default db;