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
const request = require('request');

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

// CONFIG /////////////////////////////////////////////////

const nonniePassword = '$2b$10$0tGwUTai3xpPp9kvgUbiA.NwQo6ZqJEVUqk.jU5jUZDEKmqpFOjke';
const lunchDeadlineHour = 11;
const dinnerDeadlineHour = 15;

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
    let userID = 0;
    let sql0 = `
        SELECT usrID
        FROM tblUser
        WHERE usrUsername = '${username}'
    `;
    let results0 = await query(sql0);
    if (results0.length > 0)
        userID = results0[0].usrID;
    else   
        return res.send({JSONRes});

    let sql1 = `
        SELECT usrPassword, usrVerified, usrSurname, usrIsHK
        FROM tblUser
        WHERE usrID = ${userID}
    `;
    let results1 = await query(sql1);

    const hash = results1[0].usrPassword
    if (await bcrypt.compare(password, hash)) {
        success = true;
        JSONRes = {
            success: success,
            usrID: userID,
            verified: results1[0].usrVerified,
            surname: results1[0].usrSurname,
            isHK: results1[0].usrIsHK
        };
    }
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

app.post('/get-weekend', async(req, res) =>
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
    let sql1 = `
        DELETE FROM tblUser
        WHERE usrID = ${req.body.id} 
    `;

    await query(sql1);

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

app.post('/get-week', async(req, res) =>
{
    let meals = ['Monday Lunch','Monday Dinner','Tuesday Lunch', 'Tuesday Dinner', 'Wednesday Lunch', 'Wednesday Dinner', 'Thursday Lunch', 'Thursday Dinner', 'Friday Lunch'];
    let JSONRes = [];
    let sql0 = `SELECT * FROM tblWeeklySignOut WHERE tblUser_usrID = ${req.body.id}`;
    result0 = await query(sql0);
    var index = 0;
    JSONRes.push({
        meal: meals[0],
        status: result0[0].wsoMondayLunch,
        date: getWeeklySignOutDayDate(1,1)
    });
    JSONRes.push({
        meal: meals[1],
        status: result0[0].wsoMondayDinner,
        date: getWeeklySignOutDayDate(2,1) //6
    });
    JSONRes.push({
        meal: meals[2],
        status: result0[0].wsoTuesdayLunch,
        date: getWeeklySignOutDayDate(3,2)
    });
    JSONRes.push({
        meal: meals[3],
        status: result0[0].wsoTuesdayDinner,
        date: getWeeklySignOutDayDate(4,2) //7
    });
    JSONRes.push({
        meal: meals[4],
        status: result0[0].wsoWednesdayLunch,
        date: getWeeklySignOutDayDate(5,3)
    });
    JSONRes.push({
        meal: meals[5],
        status: result0[0].wsoWednesdayDinner,
        date: getWeeklySignOutDayDate(6,3) // 8
    });
    JSONRes.push({
        meal: meals[6],
        status: result0[0].wsoThursdayLunch,
        date: getWeeklySignOutDayDate(7,4)
    });
    JSONRes.push({
        meal: meals[7],
        status: result0[0].wsoThursdayDinner,
        date: getWeeklySignOutDayDate(8,4) //9
    });
    JSONRes.push({
        meal: meals[8],
        status: result0[0].wsoFridayLunch,
        date: getWeeklySignOutDayDate(9,5)
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
    if (!signOutListScheduleExecuted)
        await getTodaySignOutList();
    var today = new Date();
    var lunchOpen = true;
    var dinnerOpen = true;
    if (today.getHours >= 11)
        lunchOpen = false;
    if (today.getHours >= 15)
        dinnerOpen = false;

    let JSONRes = {
        seatingMap: signOutList,
        lunchMeal: lunchMeal,
        lunchOpenStatus: lunchOpen,
        dinnerMeal: dinnerMeal,
        dinnerOpenStatus: dinnerOpen
    };
    return res.send({JSONRes});

    /*await getCurrentSignOutList();
    let JSONRes = {
        seatingMap: currentSignOutList,
        meal: currentMeal
    };
    res.send({JSONRes});
    */
});

app.post('/getSettings', async(req, res) =>
{
    let sql0 = `
        SELECT tblBedieningTable_talID, usrIsSemi
        FROM tblUser
        WHERE usrID = ${req.body.id}
    `;
    let result0 = (await query(sql0))[0];
    return res.send({result0});
});

app.post('/updateSettings', async (req, res) =>
{
    let jsonRes = {
        success: false
    };
    if ((req.body.oldpassword != null && req.body.oldpassword != "")
        && (req.body.newpassword != null && req.body.newpassword != ""))
    {
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
                req.body.newpassword = hash; 
                let sql = `
                    UPDATE tblUser
                    SET usrPassword = '${req.body.newpassword}'
                    WHERE usrID = ${req.body.id}
                `;
                await query(sql);
                jsonRes.success = true;

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
                return res.send({jsonRes});
            });
        }
        else
        {
            return res.send({jsonRes});
        }
    } 
});


// Helpers //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
rule.dayOfWeek = 6; // 1
rule.hour = 0;      // 0
rule.minute = 0;    // 0
rule.second = 30;   // 30
schedule.scheduleJob(rule, async() =>
{
    let sql0 = `
        SELECT tblUser_usrID
        FROM tblAnnouncement
    `;
    result0 = await query(sql0);
    for (let element of result0)
    {
        let sql1 = `
            DELETE FROM tblAnnouncement 
            WHERE tblUser_usrID = ${element.tblHK_hkaID}
        `;
        result1 = await query(sql1);
    }

    console.log("Wiped tblAnnouncement at " + new Date());

    let sql2 = `
        SELECT tblUser_usrID
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
        WHERE tblUser.usrVerified = true AND tblBedieningTable.talID = ${tableID};
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
signOutRule.dayOfWeek = new schedule.Range(1,5);
signOutRule.hour = [lunchDeadlineHour, dinnerDeadlineHour];
var signOutListScheduleExecuted = false;
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
    /*
    getCurrentSignOutList();
    */

    signOutListScheduleExecuted = true;
    getTodaySignOutList();
    
    lunchMeal = tblWeeklySignOutColumns[getMealNumberByTime("lunch")-1];
    dinnerMeal = tblWeeklySignOutColumns[getMealNumberByTime("dinner")-1];

    var mealNumber = getMealNumber() - 1;

    let sql0 = `
        SELECT usrID
        FROM tblUser
    `;
    let result0 = await query(sql0);
    for (let element of result0)
    {      
        let sql3 = `
            UPDATE tblWeeklySignOut
            SET ${tblWeeklySignOutColumns[mealNumber]} = 2
            WHERE tblUser_usrID = ${element.usrID} and ${tblWeeklySignOutColumns[mealNumber]} = 1
        `;
        await query(sql3);
    }
});

var lunchMeal;
var dinnerMeal;
var signOutList = [];
async function getTodaySignOutList()
{
    signOutList = [];

    lunchNumber = getMealNumberByTime("lunch") -1;
    dinnerNumber = getMealNumberByTime("dinner") -1;

    let sql0 = `
        SELECT usrID
        FROM tblUser
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
            WHERE tblUser_usrID = ${element.usrID}
        `;
        let result1 = await query(sql1);   
        result1 = result1[0];

        lunchMeal = await Object.keys(result1);
        lunchMeal = lunchMeal[lunchNumber];
        dinnerMeal = await Object.keys(result1);
        dinnerMeal = dinnerMeal[dinnerNumber];

        let sql2 = `
            SELECT 
                tblBedieningTable.talName,
                CONCAT(tblUser.usrName, ' ', tblUser.usrSurname) AS fullName,
                tblWeeklySignOut.${lunchMeal},
                tblWeeklySignOut.${dinnerMeal}
            FROM tblUser
            INNER JOIN tblBedieningTable ON tblBedieningTable.talID = tblUser.tblBedieningTable_talID
            INNER JOIN tblWeeklySignOut ON tblWeeklySignOut.tblUser_usrID = tblUser.usrID
            WHERE tblUser.usrID = ${element.usrID}
            ORDER BY tblUser.tblBedieningTable_talID ASC
        `;
        let result2 = (await query(sql2))[0];

        signOutList.push([result2.talName, result2.fullName, result2[lunchMeal], result2[dinnerMeal]]);
    }
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

        result = resultDate.getDate().toString() + "/" + resultDate.getMonth().toString();
    }
    return result;
}

function getMealNumber()
{
    var mealNumber;
    var today = new Date();
    var afterLunchDeadline = today.getHours() >= lunchDeadlineHour;
    var afterDinnerDeadline = today.getHours() >= dinnerDeadlineHour;
    switch ((today.getDay())) {
        case 1: mealNumber = !afterLunchDeadline ? 1 : (!afterDinnerDeadline ? 2 : 3);
            break;
        case 2: mealNumber = !afterLunchDeadline ? 3 : (!afterDinnerDeadline ? 4 : 5); 
            break;
        case 3: mealNumber = !afterLunchDeadline ? 5 : (!afterDinnerDeadline ? 6 : 7); 
            break;
        case 4: mealNumber = !afterLunchDeadline ? 7 : (!afterDinnerDeadline ? 8 : 9); 
            break;
        case 5: mealNumber = 9;
            break;
        default: mealNumber = 1; // it is weekend the moment this loads so return maonday lunch
            break;
    }
    return mealNumber;
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