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
const schedule = require('node-schedule');

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
}));
const nonniePassword = '$2b$10$0tGwUTai3xpPp9kvgUbiA.NwQo6ZqJEVUqk.jU5jUZDEKmqpFOjke';

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
    var JSONRes = {
        success: success,
        usrID: 0,
        verified: false,
        surname: ""
    };

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
            return res.send({JSONRes});

        let sql1 = `
            SELECT usrPassword, usrVerified, usrSurname
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
                    JSONRes = {
                        success: success,
                        usrID: userID,
                        verified: results1[0].usrVerified,
                        surname: results1[0].usrSurname
                    };
                }
                res.send({JSONRes});
            };
        });
    });
});

app.post('/addUser', async(req, res) => {
    
    let success = false;
    let dumObj = {
        isHk: boolean = false
    };
    let username = req.body.username;    
    let sql0 = `
        SELECT usrID
        FROM tblUser
        WHERE usrUsername = '${username}'
    `;
    let result0 = db.query(sql0, async(err0, results0) =>
    {
        if (err0)
            throw err0;
        if (results0.length != 0)
        {
            res.send({success});
        }
        else
        {
            req.body.password = bcrypt.hash(req.body.password, 10, async(errb, hash) =>
            {
                if (errb)
                    throw errb;

                req.body.password = hash; 
                let bod = req.body;
                if (bod.portfolios != null)
                    dumObj.isHk = true;
                let sql1 = `
                    INSERT INTO tblUser(usrUsername, usrEmailAddress, usrPassword, usrName, usrSurname, usrVerified, usrIsHK)
                    VALUES('${bod.username}', '${bod.email}', '${bod.password}', '${bod.name}', '${bod.surname}', false, ${dumObj.isHk})   
                `;
                result1 = db.query(sql1, async(err1, results1) =>
                {
                    if (err1)
                        throw err1;
                    
                    result2 = await query(sql0);
                    let sql2 = `INSERT INTO tblWeekendSignIN (
                        wsiFridayDinner,
                        wsiSaturdayBrunch,
                        wsiSaturdayDinner,
                        wsiSundayBreakfast,
                        wsiSundayLunch,
                        wsiSundayDinner,
                        tblUser_usrID
                    ) VALUES (
                        false,
                        false,
                        false,
                        false,
                        false,
                        false,
                        ${result2[0].usrID}
                    );`
                    result3 = await query(sql2);

                    if (dumObj.isHK)
                    {
                        let slq3 = `
                            INSERT INTO tblHK(hkaPortfolio, tblUser_usrID)
                            VALUES('${bod.portfolios}', ${result2[0].usrID})
                        `;
                        result4 = await query(sql3);
                    }
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

app.post('/weekend', async(req, res) =>
{
    let meals = ['Friday Dinner','Saturday Brunch', 'Saturday Dinner', 'Sunday Breakfast', 'Sunday Lunch', 'Sunday Dinner'];
    let JSONRes = [];
    let sql0 = `SELECT * FROM tblWeekendSignIn WHERE tblUser_usrID = ${req.body.id}`;
    result0 = await query(sql0);
    var index = 0;
    JSONRes.push({
        meal: meals[0],
        status: result0[0].wsiFridayDinner,
        date: getNextDayOfWeek(5)
    });
    JSONRes.push({
        meal: meals[1],
        status: result0[0].wsiSaturdayBrunch,
        date: getNextDayOfWeek(6)
    });
    JSONRes.push({
        meal: meals[2],
        status: result0[0].wsiSaturdayDinner,
        date: getNextDayOfWeek(6)
    });
    JSONRes.push({
        meal: meals[3],
        status: result0[0].wsiSundayBreakfast,
        date: getNextDayOfWeek(0)
    });
    JSONRes.push({
        meal: meals[4],
        status: result0[0].wsiSundayLunch,
        date: getNextDayOfWeek(0)
    });
    JSONRes.push({
        meal: meals[5],
        status: result0[0].wsiSundayDinner,
        date: getNextDayOfWeek(0)
    });
    res.send({JSONRes});
});

app.post('/updateWeekend', async(req, res) =>
{
    let sql0 = `
        UPDATE tblWeekendSignIn
        SET wsiFridayDinner = ${req.body.wsiFridayDinner},
            wsiSaturdayBrunch = ${req.body.wsiSaturdayBrunch},
            wsiSaturdayDinner = ${req.body.wsiSaturdayDinner},
            wsiSundayBreakfast = ${req.body.wsiSundayBreakfast},
            wsiSundayLunch = ${req.body.wsiSundayLunch},
            wsiSundayDinner = ${req.body.wsiSundayDinner}
        WHERE 
            tblUser_usrID = ${req.body.id}
    `;
    result0 = await query(sql0);

    let sql1 = `SELECT * FROM tblWeekendSignIn WHERE tblUser_usrID = ${req.body.id}`;
    result1 = await query(sql1);

    res.sendStatus(200);
});

app.post('/addAnnouncement', async(req, res) =>
{
    let sql0 = `
        SELECT hkaID
        FROM tblHK
        WHERE tblUser_usrID = ${req.body.id}
    `;
    result0 = await query(sql0);
    let nowDate = new Date();
    nowDate = nowDate.getTime();
    let sql1 = `
        INSERT INTO tblAnnouncement(annTitle, annMessage, annDatePosted, tblHK_hkaID)
        VALUES('${req.body.title}', '${req.body.message}', ${nowDate}, ${result0[0].hkaID})
    `;
    result1 = await query(sql1);

    res.sendStatus(200);
});

app.post('/nonnie-login', async(req,res) =>
{   
    let success = false;
    let JSONRes = {
        success: boolean = false
    };

    var password = req.body.password;
    if (await bcrypt.compare(password, nonniePassword)) {
        success = true;
        JSONRes = {
            success: success
        };
    }
    res.send({JSONRes});

});

app.get('/getUnverifiedAccounts', async(req, res) =>
{
    let sql0 = `
        SELECT *
        FROM tblUser
        WHERE usrVerified = false
    `;

    let result0 = await query(sql0);
    res.send({result0});
});

app.post('/acceptAccount', async(req, res) =>
{
    let sql0 = `
        UPDATE tblUser
        SET usrVerified = true
        WHERE usrID = ${req.body.id}
    `;

    let result0 = await query(sql0);
    res.sendStatus(200);
});

app.post('/discardAccount', async(req, res) =>
{
    let sql0 = `
        DELETE FROM tblWeekendSignIn
        WHERE tblUser_usrID = ${req.body.id}
    `;

    let result0 = await query(sql0);

    let sql1 = `
        DELETE FROM tblHK
        WHERE tblUser_usrID = ${req.body.id}
    `;

    let result1 = await query(sql1);

    let sql2 = `
        DELETE FROM tblUser
        WHERE usrID = ${req.body.id} 
    `;

    let result2 = await query(sql2);

    res.sendStatus(200);
});



// Helpers ///////////////////////////////////////////////////////////////////
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

function getNextDayOfWeek(dayOfWeek) {
    var date = new Date();
    var resultDate = new Date();
    resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);

    return resultDate.getDate().toString() + "/" + resultDate.getMonth().toString();
}

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = 1; // 1
rule.hour = 0;      // 0
rule.minute = 0;    // 0
rule.second = 30;   // 30

var imJustHere = schedule.scheduleJob(rule, async() =>
{
    let sql0 = `
        SELECT tblHK_hkaID
        FROM tblAnnouncement
    `;
    result0 = await query(sql0);
    result0.forEach(async(element) => 
    {
        let sql1 = `
            DELETE FROM tblAnnouncement 
            WHERE tblHK_hkaID = ${element.tblHK_hkaID}
        `;
        result1 = await query(sql1);
    });

    console.log("Wiped tblAnnouncement at " + new Date());

    let sql2 = `
        SELECT tblUser_usrID
        FROM tblWeekendSignIn
    `;
    result2 = await query(sql2);
    result2.forEach(async(element) => 
    {
        let sql3 = `
        UPDATE tblWeekendSignIn
        SET wsiFridayDinner = 0,
            wsiSaturdayBrunch = 0,
            wsiSaturdayDinner = 0,
            wsiSundayBreakfast = 0,
            wsiSundayLunch = 0,
            wsiSundayDinner = 0
        WHERE 
            tblUser_usrID = ${element.tblUser_usrID}
        `;
        result3 = await query(sql3);
    });
    console.log("Reset tblWeekendSignIn at " + new Date());
});