const express = require('express');
const app = express();
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session'); 
const bcrypt = require("bcrypt");
const async = require('async');
const https = require('https');
const http = require('http');

// SETUP //////////////////////////////////////////
const db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'Ds19970419!',
    database : 'dbSonopApp'
});
app.listen(3000, function(){
    console.log("I'm listening on 3000");
})
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
})); 
db.connect((err) => {
    if (err)
    {
        throw err;
    }
    console.log("MySQL Connected");
});
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}))

// EXAMPLES /////////////////////////////////////////////////

app.get('/testing', (req, res) => {
    console.log("success con");
    let success = true;
    res.send({success});
});

app.get('/getsomething_template/:id', (req, res) => {
    let sql = `SELECT * FROM tblUser WHERE usrID = ${req.params.id}`;

    let query =  db.query(sql, (err, result) =>{
        if (err) 
            throw err;
        console.log(result);
        res.send(result);
    })

});

// FUNCTIONS ///////////////////////////

app.post('/login', async(req, res) => {
    let success = false;
    let username = req.body.username;
    let password = req.body.password;
    if(typeof username !== "string" || typeof password !== "string" || username == null) {
        return res.sendStatus(400);
    }

    let userID = 0;
    let sql0 = `
        SELECT usrID
        FROM tblUser
        WHERE usrUsername = '${username}'
    `;
    let result0 = await db.query(sql0, async(err0, results0) =>
    {
        if (err0)
            throw err0;
        if (results0.length > 0)
        {
            userID = results0[0].usrID;
        }
        else   
            return res.send({success});

        let sql1 = `
            SELECT usrPassword
            FROM tblUser
            WHERE usrID = ${userID}
        `;
        let result1 = await db.query(sql1, async(err1, results1) =>
        {
            if (err1)
                throw err1;
            if (await results1.length > 0)
            {
                const hash = await results1[0].usrPassword
                if (await bcrypt.compare(password, hash)) {
                    success = true;
                }
                res.send({success});
            };
        });
    });
});

app.post('/addUser', async(req, res) => {
    
    let success = false;
    let username = req.body.username;    
    let sql0 = `
        SELECT usrID
        FROM tblUser
        WHERE usrUsername = '${username}'
    `;
    let result0 = db.query(sql0, (err0, results0) =>
    {
        if (err0)
            throw err0;
        if (results0.length != 0)
        {
            res.send({success});
        }
        else
        {
            req.body.password = bcrypt.hash(req.body.password, 10, function(errb, hash)
            {
                if (errb)
                    throw errb;

                req.body.password = hash; 
                let bod = req.body;
                let sql1 = `
                    INSERT INTO tblUser(usrUsername, usrEmailAddress, usrPassword, usrName, usrSurname)
                    VALUES('${bod.username}', '${bod.email}', '${bod.password}', '${bod.name}', '${bod.surname}')   
                `;
                result1 = db.query(sql1, (err1, results1) =>
                {
                    if (err1)
                        throw err1;
                    success = true;
                    res.send({success});
                });
            });
        }
    });
});

app.get('/announcements', async(req, res) => {
    var announcements = [];
    let sql0 = `
        SELECT *
        FROM tblAnnouncement
    `;
    let result0 = await db.query(sql0, async(err0, results0) =>
    {
        if (err0)
            throw err0;

        for (let announcement of results0)
        {   
            let HKfk = announcement.tblHK_hkaID;
            let sql1 = `
                SELECT tblUser.usrName, tblUser.usrSurname
                FROM tblUser
                INNER JOIN tblHK ON tblUser.usrID = tblHK.tblUser_usrID
                WHERE tblHK.hkaID = ${HKfk}
            `;

            result1 = await query(sql1);

            let nameSurname = result1[0].usrName + " " + result1[0].usrSurname;
            let humanDate = new Date(announcement.annDatePosted);

            announcements.push({
                id: announcement.annID,
                title: announcement.annTitle,
                message: announcement.annMessage,
                date: humanDate,
                postedBy: nameSurname
            });
        }
        res.send({announcements});
    });
});

function query(...args) {
	return new Promise((resolve, reject) => {
		db.query(...args, (err, results) => {
			if(err) {
				reject(err);
			} else {
				resolve(results);
			}
		});
	});
}