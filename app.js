// Sonop Raspberry Pi 
// vnc: pi@10.0.10.225
//      sonoproot

// for internet on hotspot.sonop.org.za
// pi
// sonoproot

// IMPORTS //////////////////////////////////////////
const express = require('express');
const app = express();
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session'); 
const bcrypt = require('bcrypt');
const async = require('async');
const https = require('https');
const http = require('http');
const schedule = require('node-schedule');
const request = require('request');
const nodemailer = require('nodemailer');

// SETUP //////////////////////////////////////////
app.listen(3000, function(){
    console.log("I'm listening on 3000");
})
var db = {
    host     : 'localhost',
    user     : 'root',
    password : 'sonoproot', //sonoproot
    database : 'dbSonopApp',
    insecureAuth: true
};

var connection;

function handleDisconnect()
{
    connection = mysql.createConnection(db);

    connection.connect((err) =>
    {              
        if(err) {                                   
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); 
        }                                     
    });                                     
    console.log("MySQL Connected");
    connection.on('error',(err) =>
    {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();                         
        } else {                                    
            throw err;                                  
        }
    });
}
handleDisconnect();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
})); 
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));

// CONFIG /////////////////////////////////////////////////

const nonniePassword = '$2b$10$0tGwUTai3xpPp9kvgUbiA.NwQo6ZqJEVUqk.jU5jUZDEKmqpFOjke';
const lunchDeadlineHour = 11;
const dinnerDeadlineHour = 15;
const wipeAnnouncementsAndWeekendSignInDay = 0;
const wipeAnnouncementsAndWeekendSignInHour = 17;
const resetsignOutResetDay = 6;
const resetsignOutResetHour = 23;
const bestCoderSurname = "Scheepers";
const emailNotificationDay = 3; // [1, 3]
const emailNotificationHour = 12; // 12
const emailNotificationMinute = 0; // 0
const emailConfig = {
    "from": "SonopApp <sonoppi123@gmail.com>",
    "transport": {
        "service": "gmail",
        "auth": {
            "user": "sonoppi123@gmail.com",
            "pass": "sonoproot"
        }
    }
};
const emailNotificationSubjectLine = `Weekend Sign In Reminder`;
const emailNotificationMessage = `Please remember to sign in for this weekend. You will make Nonnie very happy.

http://10.0.5.103:8100/\n`;

const transporter = nodemailer.createTransport(emailConfig.transport);

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

    let studentNumber = req.body.studentNumber;
    // let username = req.body.username;
    // let password = req.body.password;
    let userID = 0;
    let sql0 = `
        SELECT usrID
        FROM tblUser
        WHERE usrStudentNumber = '${studentNumber}'
    `;
    let results0 = await query(sql0);
    if (results0.length > 0)
        userID = results0[0].usrID;
    else   
        return res.send({JSONRes});

    let sql1 = `
        SELECT usrPassword, usrVerified, usrSurname, usrIsHK, usrSurname
        FROM tblUser
        WHERE usrID = ${userID}
    `;
    let results1 = await query(sql1);

    const hash = results1[0].usrPassword;
    success = true;
    var isTheBestCoder = false;
    if (results1[0].usrSurname == bestCoderSurname)
        isTheBestCoder = true;
    JSONRes = {
        success: success,
        usrID: userID,
        verified: results1[0].usrVerified,
        surname: results1[0].usrSurname,
        isHK: results1[0].usrIsHK,
        isTheBestCoder: isTheBestCoder
    };
    res.send({JSONRes});
});

app.post('/addUser', async(req, res) => {
    
    let success = false;
    let username = req.body.username;    
    let sql0 = `
        SELECT usrID
        FROM tblUser
        WHERE usrUsername = '${username}'
    `;
    let results0 = await query(sql0);
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
            let sql1 = `
                INSERT INTO tblUser(
                    usrUsername, 
                    usrEmailAddress, 
                    usrPassword, 
                    usrName, 
                    usrSurname,
                    usrStudentNumber,
                    usrFirstYearYear,
                    usrIsSemi,
                    tblBedieningTable_talID, 
                    usrVerified, 
                    usrIsHK)
                VALUES(
                    '${req.body.username}', 
                    '${req.body.email}', 
                    '${req.body.password}', 
                    '${req.body.name}', 
                    '${req.body.surname}',
                    '${req.body.studentnumber}',
                    ${req.body.firstyearyear},
                    ${req.body.semi},
                    ${req.body.bedieningtable}, 
                    false, 
                    ${req.body.isHk})   
            `;
            results1 = await query(sql1);

            result2 = await query(sql0);
            let sql2 = `INSERT INTO tblWeekendSignIn (
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

            let sql3 = `INSERT INTO tblWeeklySignOut (
                wsoMondayLunch,
                wsoMondayDinner,
                wsoTuesdayLunch,
                wsoTuesdayDinner,
                wsoWednesdayLunch,
                wsoWednesdayDinner,
                wsoThursdayLunch,
                wsoThursdayDinner,
                wsoFridayLunch,
                tblUser_usrID
            ) VALUES (
                2,
                2,
                2,
                2,
                2,
                2,
                2,
                2,
                2,
                ${result2[0].usrID}
            )`;
            result4 = await query(sql3);

            success = true;
            res.send({success});
        });
    }
});

app.get('/getAnnouncements', async(req, res) => {
    var announcements = [];
    let sql0 = `
        SELECT *
        FROM tblAnnouncement
        ORDER BY annPriority DESC, annDatePosted DESC
    `;
    
    results0 = await query(sql0);

    for (let announcement of results0)
        {   
            let HKfk = announcement.tblUser_usrID;
            let sql1 = `
                SELECT CONCAT(usrName, ' ', usrSurname) AS fullName
                FROM tblUser
                WHERE usrID = ${HKfk}
            `;
            result1 = await query(sql1);
            announcements.push({
                id: announcement.annID,
                title: announcement.annTitle,
                message: announcement.annMessage,
                date: announcement.annDatePosted,
                priority: announcement.annPriority,
                postedBy: result1[0].fullName
            });
        }
        res.send({announcements});
});

const weekendMeals = ['Friday Dinner','Saturday Brunch', 'Saturday Dinner', 'Sunday Breakfast', 'Sunday Lunch', 'Sunday Dinner'];
app.post('/get-weekend', async(req, res) =>
{
    let JSONRes = [];
    let sql0 = `SELECT * FROM tblWeekendSignIn WHERE tblUser_usrID = ${req.body.id}`;
    result0 = await query(sql0);
    var index = 0;
    JSONRes.push({
        meal: weekendMeals[0],
        status: result0[0].wsiFridayDinner,
        date: getNextDayOfWeek(5)
    });
    JSONRes.push({
        meal: weekendMeals[1],
        status: result0[0].wsiSaturdayBrunch,
        date: getNextDayOfWeek(6)
    });
    JSONRes.push({
        meal: weekendMeals[2],
        status: result0[0].wsiSaturdayDinner,
        date: getNextDayOfWeek(6)
    });
    JSONRes.push({
        meal: weekendMeals[3],
        status: result0[0].wsiSundayBreakfast,
        date: getNextDayOfWeek(0)
    });
    JSONRes.push({
        meal: weekendMeals[4],
        status: result0[0].wsiSundayLunch,
        date: getNextDayOfWeek(0)
    });
    JSONRes.push({
        meal: weekendMeals[5],
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

    res.sendStatus(200);
});

app.post('/addAnnouncement', async(req, res) =>
{
    let nowDate = new Date().getTime();
    let sql1 = `
        INSERT INTO tblAnnouncement(annTitle, annMessage, annDatePosted, annPriority, tblUser_usrID)
        VALUES('${req.body.title}', '${req.body.message}', ${nowDate}, ${req.body.priority}, ${req.body.id})
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
        SELECT 
            tblUser.usrID, 
            tblUser.usrUsername, 
            tblUser.usrEmailAddress, 
            CONCAT(tblUser.usrName, ' ', tblUser.usrSurname) AS fullName, 
            tblUser.usrIsHK,
            tblBedieningTable.talName
        FROM tblUser
        INNER JOIN tblBedieningTable ON tblUser.tblBedieningTable_talID = tblBedieningTable.talID
        WHERE usrVerified = false
    `;

    let result0 = await query(sql0);
    res.send({result0});
});

app.get('/getVerifiedAccounts', async(req, res) =>
{
    let sql = `
        SELECT 
            tblUser.usrID, 
            tblUser.usrUsername, 
            tblUser.usrEmailAddress, 
            CONCAT(tblUser.usrName, ' ', tblUser.usrSurname) AS fullName, 
            tblUser.usrIsHK,
            tblBedieningTable.talName,
            tblUser.usrIsSemi,
            tblUser.tblBedieningTable_talID
        FROM tblUser
        INNER JOIN tblBedieningTable ON tblUser.tblBedieningTable_talID = tblBedieningTable.talID
        WHERE usrVerified = true
        ORDER BY tblUser.tblBedieningTable_talID ASC, fullName ASC
    `;

    let result0 = await query(sql);
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
    let sql = `
        DELETE FROM tblUser
        WHERE usrID = ${req.body.id} 
    `;

    await query(sql);

    res.sendStatus(200);
});

app.post('/deleteAccount', async(req, res) =>
{
    let sql = `
        DELETE FROM tblUser
        WHERE usrID = ${req.body.id}
    `;

    await query(sql);

    res.sendStatus(200);
});

app.get('/weekendSignInList', async(req, res) =>
{
    let seatingMap = [];
    for (let index = 0; index < 11; index++) 
    {
        seatingMap[index] = await getPeopeleAtTableForWeekend(index+1);
    }

    res.send({seatingMap});
});

app.get('/bibleVerse', async(req, res) =>
{
    if (bibleVerseJSON)
        res.send({bibleVerseJSON});
    else
        res.sendStatus(500);
});

const weekMeals = ['Monday Lunch','Monday Dinner','Tuesday Lunch', 'Tuesday Dinner', 'Wednesday Lunch', 'Wednesday Dinner', 'Thursday Lunch', 'Thursday Dinner', 'Friday Lunch'];
app.post('/get-week', async(req, res) =>
{
    let JSONRes = [];
    let sql0 = `SELECT * FROM tblWeeklySignOut WHERE tblUser_usrID = ${req.body.id}`;
    result0 = await query(sql0);
    JSONRes.push({
        meal: weekMeals[0],
        status: result0[0].wsoMondayLunch,
        date: getWeeklySignOutDayDate(1,1),
        openStatus: getOpenStatus(1)
    });
    JSONRes.push({
        meal: weekMeals[1],
        status: result0[0].wsoMondayDinner,
        date: getWeeklySignOutDayDate(2,1),
        openStatus: getOpenStatus(2)
    });
    JSONRes.push({
        meal: weekMeals[2],
        status: result0[0].wsoTuesdayLunch,
        date: getWeeklySignOutDayDate(3,2),
        openStatus: getOpenStatus(3)
    });
    JSONRes.push({
        meal: weekMeals[3],
        status: result0[0].wsoTuesdayDinner,
        date: getWeeklySignOutDayDate(4,2),
        openStatus: getOpenStatus(4)
    });
    JSONRes.push({
        meal: weekMeals[4],
        status: result0[0].wsoWednesdayLunch,
        date: getWeeklySignOutDayDate(5,3),
        openStatus: getOpenStatus(5)
    });
    JSONRes.push({
        meal: weekMeals[5],
        status: result0[0].wsoWednesdayDinner,
        date: getWeeklySignOutDayDate(6,3),
        openStatus: getOpenStatus(6)
    });
    JSONRes.push({
        meal: weekMeals[6],
        status: result0[0].wsoThursdayLunch,
        date: getWeeklySignOutDayDate(7,4),
        openStatus: getOpenStatus(7)
    });
    JSONRes.push({
        meal: weekMeals[7],
        status: result0[0].wsoThursdayDinner,
        date: getWeeklySignOutDayDate(8,4),
        openStatus: getOpenStatus(8)
    });
    JSONRes.push({
        meal: weekMeals[8],
        status: result0[0].wsoFridayLunch,
        date: getWeeklySignOutDayDate(9,5),
        openStatus: getOpenStatus(9)
    });
    res.send({JSONRes});
});

app.post('/updateWeeklySignOut', async(req, res) =>
{
    let sql0 = `
        UPDATE tblWeeklySignOut
        SET wsoMondayLunch = ${req.body.wsoMondayLunch},
            wsoMondayDinner = ${req.body.wsoMondayDinner},
            wsoTuesdayLunch = ${req.body.wsoTuesdayLunch},
            wsoTuesdayDinner = ${req.body.wsoTuesdayDinner},
            wsoWednesdayLunch = ${req.body.wsoWednesdayLunch},
            wsoWednesdayDinner = ${req.body.wsoWednesdayDinner},
            wsoThursdayLunch = ${req.body.wsoThursdayLunch},
            wsoThursdayDinner = ${req.body.wsoThursdayDinner},
            wsoFridayLunch = ${req.body.wsoFridayLunch}
        WHERE 
            tblUser_usrID = ${req.body.id}
    `;
    result0 = await query(sql0);

    res.sendStatus(200);
});

app.get('/currentSignInList', async(req,res) =>
{

    await getTodaySignOutList();
    
    var today = new Date();
    var lunchOpen = true;
    var dinnerOpen = true;
    if (today.getHours >= lunchDeadlineHour)
        lunchOpen = false;
    if (today.getHours >= dinnerDeadlineHour)
        dinnerOpen = false;

    let JSONRes = {
        seatingMap: signOutList,
        lunchMeal: lunchMeal,
        lunchOpenStatus: lunchOpen,
        dinnerMeal: dinnerMeal,
        dinnerOpenStatus: dinnerOpen
    };
    res.send({JSONRes});
});

app.post('/getSettings', async(req, res) =>
{
    let sql0 = `
        SELECT tblBedieningTable_talID, usrIsSemi, usrEmailAddress
        FROM tblUser
        WHERE usrID = ${req.body.id}
    `;
    let result0 = (await query(sql0))[0];
    return res.send({result0});
});

app.post('/updateSettings', async (req, res) =>
{
    var sql1;
    if (req.body.bedieningTableID != 1)
    {
        sql1 = `
            UPDATE tblUser
            SET 
                tblBedieningTable_talID = ${req.body.bedieningTableID}, 
                usrIsHK = false,
                usrIsSemi = ${req.body.semi},
                usrEmailAddress = '${req.body.email}'
            WHERE usrID = ${req.body.id}
        `;
    }
    else
    {
        sql1 = `
            UPDATE tblUser
            SET 
                tblBedieningTable_talID = ${req.body.bedieningTableID}, 
                usrIsHK = true,
                usrIsSemi = ${req.body.semi},
                usrEmailAddress = ${req.body.email}
            WHERE usrID = ${req.body.id}
        `;
    }
    await query(sql1);
    return res.sendStatus(200);
});

app.post('/updateAccountInformation', async (req, res) =>
{
    var sql1;
    if (req.body.bedieningTableID != 1)
    {
        sql1 = `
            UPDATE tblUser
            SET 
                tblBedieningTable_talID = ${req.body.bedieningTableID}, 
                usrIsHK = false,
                usrIsSemi = ${req.body.semi}
            WHERE usrID = ${req.body.id}
        `;
    }
    else
    {
        sql1 = `
            UPDATE tblUser
            SET 
                tblBedieningTable_talID = ${req.body.bedieningTableID}, 
                usrIsHK = true,
                usrIsSemi = ${req.body.semi}
            WHERE usrID = ${req.body.id}
        `;
    }
    await query(sql1);
    return res.sendStatus(200);
});

app.post('/updatePassword', async (req, res) =>
{
    let jsonRes = {
        success: false
    };
    let sql0 = `
        SELECT usrPassword
        FROM tblUser
        WHERE usrID = ${req.body.id}
    `;    
    let result0 = await query(sql0);
    if (await bcrypt.compare(req.body.oldpassword, result0[0].usrPassword)) 
    {
        await bcrypt.hash(req.body.newpassword, 10, async(errb, hash) =>
        {
            if (errb)
                res.send({jsonRes});

            req.body.newpassword = hash; 
            let sql = `
                UPDATE tblUser
                SET usrPassword = '${req.body.newpassword}'
                WHERE usrID = ${req.body.id}
            `;
            await query(sql);
            jsonRes.success = true;

            return res.send({jsonRes});
        });
    }
    else
    {
        return res.send({jsonRes});
    }
});
    

// Helpers //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function query(...args) {
	return new Promise((resolve, reject) => {
		connection.query(...args, (err, results) => {
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

    return resultDate.getDate().toString() + "/" + (resultDate.getMonth()+1).toString();
}

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = wipeAnnouncementsAndWeekendSignInDay;
rule.hour = wipeAnnouncementsAndWeekendSignInHour;
rule.minute = 0;    // 0
rule.second = 30;   // 30
schedule.scheduleJob(rule, async() =>
{
    let sql0 = `
        SELECT DISTINCT tblUser_usrID
        FROM tblAnnouncement
    `;
    result0 = await query(sql0);
    for (let element of result0)
    {
        let sql1 = `
            DELETE FROM tblAnnouncement 
            WHERE tblUser_usrID = ${element.tblUser_usrID}
        `;
        await query(sql1);
    }

    console.log("Wiped tblAnnouncement at " + new Date());

    let sql2 = `
        SELECT DISTINCT tblUser_usrID
        FROM tblWeekendSignIn
    `;
    result2 = await query(sql2);
    for (let element of result2) 
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
    };
    console.log("Reset tblWeekendSignIn at " + new Date());
});

let bibleVerseJSON = "";
getBibleVerse();
var bVtimeRule = new schedule.RecurrenceRule();
bVtimeRule.hour = 0;  // 0
bVtimeRule.minute = 1; // 1
schedule.scheduleJob(bVtimeRule, async() =>
{
    getBibleVerse();
});
function getBibleVerse()
{
    var url = 'http://beta.ourmanna.com/api/v1/get/?format=json';
    var proxyUrl = 'http://cors-anywhere.herokuapp.com/' + url;

    request({
        url: url,
        json: true
    }, (error, response, body) =>
    {
        if (response && !error & response.statusCode === 200)
        {
            bibleVerseJSON = body;
        }
        else 
        {
            console.log("Error: " + error);
        }
    });    
}

async function getPeopeleAtTableForWeekend(tableID)
{
    let sql0 = `
        SELECT 
            tblBedieningTable.talName,
            CONCAT(tblUser.usrName, ' ', tblUser.usrSurname) AS fullName,
            tblWeekendSignIn.wsiFridayDinner,
            tblWeekendSignIn.wsiSaturdayBrunch,
            tblWeekendSignIn.wsiSaturdayDinner,
            tblWeekendSignIn.wsiSundayBreakfast,
            tblWeekendSignIn.wsiSundayLunch,
            tblWeekendSignIn.wsiSundayDinner
        FROM tblUser
        INNER JOIN tblWeekendSignIn ON tblWeekendSignIn.tblUser_usrID = tblUser.usrID
        INNER JOIN tblBedieningTable ON tblUser.tblBedieningTable_talID = tblBedieningTable.talID
        WHERE tblUser.usrVerified = true AND tblBedieningTable.talID = ${tableID}
        ORDER BY tblBedieningTable.talName ASC, fullName ASC
    `;    
    var result = [];
    var data = await query(sql0);
    for (let element of data)
    {
        var row = [];
        row.push(element.talName);
        row.push(element.fullName);
        row.push(element.wsiFridayDinner);
        row.push(element.wsiSaturdayBrunch);
        row.push(element.wsiSaturdayDinner);
        row.push(element.wsiSundayBreakfast);
        row.push(element.wsiSundayLunch);
        row.push(element.wsiSundayDinner);
        result.push(row);
    }
    return result;
}

var signOutRule = new schedule.RecurrenceRule();
signOutRule.dayOfWeek = resetsignOutResetDay;
signOutRule.hour = resetsignOutResetHour;
var tblWeeklySignOutColumns = [
    "wsoMondayLunch", 
    "wsoMondayDinner", 
    "wsoTuesdayLunch", 
    "wsoTuesdayDinner", 
    "wsoWednesdayLunch", 
    "wsoWednesdayDinner", 
    "wsoThursdayLunch", 
    "wsoThursdayDinner", 
    "wsoFridayLunch"
];
schedule.scheduleJob(signOutRule, async()=>
{
    let sql0 = `
        SELECT tblUser_usrID
        FROM tblWeeklySignOut
    `;

    let result0 = await query(sql0);

    for (let element of result0)
    {
        for (let mealNumber = 0; mealNumber < tblWeeklySignOutColumns.length; mealNumber++) {
            let sql1 = `
                UPDATE tblWeeklySignOut
                SET ${tblWeeklySignOutColumns[mealNumber]} = 2
                WHERE tblUser_usrID = ${element.tblUser_usrID} and ${tblWeeklySignOutColumns[mealNumber]} = 1
            `;
            await query(sql1);
        }
    }
});

var emailNotificationRule = new schedule.RecurrenceRule();
emailNotificationRule.dayOfWeek = emailNotificationDay;
emailNotificationRule.hour = emailNotificationHour;
emailNotificationRule.minute = emailNotificationMinute;
schedule.scheduleJob(emailNotificationRule, async() =>
{
    sendNotificationEmail();
});
async function sendNotificationEmail()
{
    let sql0 = `
        SELECT usrID, usrEmailAddress, usrSurname, usrVerified
        FROM tblUser
    `;
    let results0 = await query(sql0);
    for (let i = 0; i < results0.length; i++) {
        const element = results0[i];
        if (element.usrVerified === 0) {
            return;
        }
        let user = {
            name: element.usrSurname,
            email: element.usrEmailAddress
        };
        let message = emailNotificationMessage + '\n' + await getMealsSignedInListForUserMessage(element.usrID);
        await sendMail(user, emailNotificationSubjectLine, message);
    }
    console.log(`Notification by email sent to ${results0.length} users`);
}

async function sendMail(user, subject, message)
{
    return new Promise((resolve, reject) => {
		transporter.sendMail({
			from: emailConfig.from,
			to: user.email,
			subject,
			text: `Hi Mnr. ${user.name},\n\n${message}\n\nKind regards,\nSonopApp Team`
		}, (err) => {
			if(err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

async function getMealsSignedInListForUserMessage(usrID)
{
    let message = '';
    const sql0 = `
        SELECT *
        FROM tblWeekendSignIn
        WHERE tblUser_usrID = ${usrID}
    `;

    const result0 = (await query(sql0))[0];
    console.log('qqqq', result0);
    console.log('a: ', result0.wsiFridayDinner)
    if (result0.wsiFridayDinner === 1) {
        message = message + `\n    ${weekendMeals[0]}`
    }
    if (result0.wsiSaturdayBrunch === 1) {
        message = message + `\n    ${weekendMeals[1]}`
    }
    if (result0.wsiSaturdayDinner === 1) {
        message = message + `\n    ${weekendMeals[2]}`
    }
    if (result0.wsiSundayBreakfast === 1) {
        message = message + `\n   ${weekendMeals[3]}`
    }
    if (result0.wsiSundayLunch === 1) {
        message = message + `\n    ${weekendMeals[4]}`
    }
    if (result0.wsiSundayDinner === 1) {
        message = message + `\n    ${weekendMeals[5]}`
    }

    console.log('mm', message, 'ffff', usrID);
    if (message.length === 0) {
        return `You haven't signed in yet.`;
    } else {
        return `You have signed in for:` + message;
    }
}

var lunchMeal;
var dinnerMeal;
var signOutList = [];
async function getTodaySignOutList()
{
    signOutList = [];

    lunchNumber = await getMealNumberByTime("lunch") -1;
    dinnerNumber = await getMealNumberByTime("dinner") -1;

    let sql0 = `
        SELECT tblWeeklySignOut.tblUser_usrID
        FROM tblWeeklySignOut
        INNER JOIN tblUser ON tblWeeklySignOut.tblUser_usrID = tblUser.usrID
        INNER JOIN tblBedieningTable ON tblBedieningTable.talID = tblBedieningTable_talID
        ORDER BY tblBedieningTable.talID, tblUser.usrName ASC
    `;
    let result0 = await query(sql0);

    for (let element of result0)
    {
        let sql1 = `
            SELECT wsoMondayLunch, 
                wsoMondayDinner, 
                wsoTuesdayLunch, 
                wsoTuesdayDinner, 
                wsoWednesdayLunch, 
                wsoWednesdayDinner, 
                wsoThursdayLunch, 
                wsoThursdayDinner, 
                wsoFridayLunch
            FROM tblWeeklySignOut
            WHERE tblUser_usrID = ${element.tblUser_usrID}
        `;
        let result1 = (await query(sql1))[0];

        lunchMeal = await Object.keys(result1);
        lunchMeal = lunchMeal[lunchNumber];
        dinnerMeal = await Object.keys(result1);
        dinnerMeal = dinnerMeal[dinnerNumber];

        let sql2 = `
            SELECT 
                tblBedieningTable.talName,
                tblUser.usrIsSemi,
                CONCAT(tblUser.usrName, ' ', tblUser.usrSurname) AS fullName,
                tblWeeklySignOut.${lunchMeal},
                tblWeeklySignOut.${dinnerMeal}
            FROM tblUser
            INNER JOIN tblBedieningTable ON tblBedieningTable.talID = tblUser.tblBedieningTable_talID
            INNER JOIN tblWeeklySignOut ON tblWeeklySignOut.tblUser_usrID = tblUser.usrID
            WHERE tblUser.usrID = ${element.tblUser_usrID}
            ORDER BY tblUser.tblBedieningTable_talID ASC, fullName DESC
        `;
        let result2 = (await query(sql2))[0];
        var tableName = result2.talName;
        if (result2.usrIsSemi)
            tableName += " (Semi)";
        signOutList.push([tableName, result2.fullName, result2[lunchMeal], result2[dinnerMeal]]);
    }

    lunchMeal = await getHumanDayOfDBDay(lunchMeal);
    dinnerMeal = await getHumanDayOfDBDay(dinnerMeal);
}

function getMealNumberByTime(time)
{
    var offset = 0;
    if (time == "dinner")
        offset = 1;
    var mealNumber;
    var today = new Date();
    switch (today.getDay())
    {
        case 1: mealNumber = 1;
            break;
        case 2: mealNumber = 3;
            break;
        case 3: mealNumber = 5;
            break;
        case 4: mealNumber = 7;
            break;
        case 5: mealNumber = 9;
            break;
        default: mealNumber = 1;
    }
    return mealNumber + offset;
}

function getWeeklySignOutDayDate(mealPos, dayOfWeek)
{
    var result;
    if (!mealAlreadyPassedToday(mealPos))
        result = getNextDayOfWeek(dayOfWeek);
    else
    {
        var date = new Date();
        var currentDate = new Date();
        currentDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);
        var resultDate = new Date(currentDate.getTime() + 604800000); // week  = 604800000 miliseconds

        result = resultDate.getDate().toString() + "/" + (resultDate.getMonth()+1).toString();
    }
    return result;
}

function mealAlreadyPassedToday(mealPosition)
{
    var today = new Date();
    var afterLunchDeadline = today.getHours() >= lunchDeadlineHour;
    var afterDinnerDeadline = today.getHours() >= dinnerDeadlineHour;
    var todayDay = today.getDay();
    switch (mealPosition) {
        case 1: return (afterLunchDeadline && todayDay == 1) ? true : false;
        case 2: return (afterDinnerDeadline && todayDay == 1) ? true : false;
        case 3: return (afterLunchDeadline && todayDay == 2) ? true : false;
        case 4: return (afterDinnerDeadline && todayDay == 2) ? true : false;
        case 5: return (afterLunchDeadline && todayDay == 3) ? true : false;
        case 6: return (afterDinnerDeadline && todayDay == 3) ? true : false;
        case 7: return (afterLunchDeadline && todayDay == 4) ? true : false;
        case 8: return (afterDinnerDeadline && todayDay == 4) ? true : false;
        case 9: return (afterLunchDeadline && todayDay == 5) ? true : false;
    
        default: return false;
    } 
}

function getOpenStatus(mealPosition)
{
    var today = new Date();
    var afterLunchDeadline = today.getHours() >= lunchDeadlineHour;
    var afterDinnerDeadline = today.getHours() >= dinnerDeadlineHour;
    var todayDay = today.getDay();
    switch (mealPosition) {
        case 1: return ((!afterLunchDeadline && todayDay == 1) || todayDay < 1) ? true : false;
        case 2: return ((!afterDinnerDeadline && todayDay == 1) || todayDay < 1) ? true : false;
        case 3: return ((!afterLunchDeadline && todayDay == 2) || todayDay < 2) ? true : false;
        case 4: return ((!afterDinnerDeadline && todayDay == 2) || todayDay < 2) ? true : false;
        case 5: return ((!afterLunchDeadline && todayDay == 3) || todayDay < 3) ? true : false;
        case 6: return ((!afterDinnerDeadline && todayDay == 3) || todayDay < 3) ? true : false;
        case 7: return ((!afterLunchDeadline && todayDay == 4) || todayDay < 4) ? true : false;
        case 8: return ((!afterDinnerDeadline && todayDay == 4) || todayDay < 4) ? true : false;
        case 9: return ((!afterLunchDeadline && todayDay == 5) || todayDay < 5) ? true : false;
    
        default: return false;
    } 
}

function getHumanDayOfDBDay(dbName)
{
    var result = "";
    var firstCap = false;
    var secondCap = false;
    for (let index = 0; index < dbName.length; index++) 
    {
        if (!firstCap && dbName.charAt(index) == dbName.charAt(index).toUpperCase())
        {
            firstCap = true;
            result += dbName.charAt(index);
        }
        else if (firstCap && !secondCap && dbName.charAt(index) != dbName.charAt(index).toUpperCase())
        {
            result += dbName.charAt(index);
        }
        else if (firstCap && !secondCap && dbName.charAt(index) == dbName.charAt(index).toUpperCase())
        {
            secondCap = true;
            result += " " + dbName.charAt(index);
        }
        else if (firstCap && secondCap)
        {
            result += dbName.charAt(index);
        }
    }
    return result;
}