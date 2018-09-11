USE dbSonopApp;

INSERT INTO tblUser (
	usrUsername,
	usrEmailAddress,
	usrPassword,
	usrName,
	usrSurname,
    usrStudentNumber,
    usrFirstYearYear,
    usrVerified,
    usrIsHK,
    tblBedieningTable_talID
) VALUES (
	"admin",
	"darius@gmail.com",
	"$2b$10$FQC34vY6SsY.b7OxVnhQFeBmELsir.Ova0dbN39spFwdF4QEFUVQu",
	"Darius",
	"Scheepers",
    "16006250",
    2016,
    true,
    true,
    1
);

INSERT INTO tblUser (
	usrUsername,
	usrEmailAddress,
	usrPassword,
	usrName,
	usrSurname,
    usrStudentNumber,
    usrFirstYearYear,
    usrVerified,
    usrIsHK,
    tblBedieningTable_talID
) VALUES (
	"hasie",
	"gmail@hasie.com",
	"$2b$10$FQC34vY6SsY.b7OxVnhQFeBmELsir.Ova0dbN39spFwdF4QEFUVQu",
	"Johan",
	"Haasbroek",
    "15002020",
    2016,
    false,
    true,
    4
);

INSERT INTO tblHK (
	hkaPortfolio,
    tblUser_usrID
) VALUES (
	"Onder-Voorsitter, IT",
    2
);

INSERT INTO tblHK (
	hkaPortfolio,
    tblUser_usrID
) VALUES (
	"Awesome",
    1
);
    
INSERT INTO tblUser (
	usrUsername,
	usrEmailAddress,
	usrPassword,
	usrName,
	usrSurname,
    usrStudentNumber,
    usrFirstYearYear,
    usrVerified,
    usrIsHK,
    tblBedieningTable_talID
) VALUES (
	"chala",
	"chal@hasie.com",
	"$2b$10$FQC34vY6SsY.b7OxVnhQFeBmELsir.Ova0dbN39spFwdF4QEFUVQu",
	"chal",
	"ekIsnie",
    "15808500",
    2016,
    false,
    true,
    3
);

    

