USE dbSonopApp;

INSERT INTO tblUser (
	usrUsername,
	usrEmailAddress,
	usrPassword,
	usrName,
	usrSurname
) VALUES (
	"admin",
	"darius@gmail.com",
	"$2b$10$FQC34vY6SsY.b7OxVnhQFeBmELsir.Ova0dbN39spFwdF4QEFUVQu",
	"Darius",
	"Scheepers"
);

INSERT INTO tblUser (
	usrUsername,
	usrEmailAddress,
	usrPassword,
	usrName,
	usrSurname
) VALUES (
	"hasie",
	"gmail@hasie.com",
	"$2b$10$FQC34vY6SsY.b7OxVnhQFeBmELsir.Ova0dbN39spFwdF4QEFUVQu",
	"Johan",
	"Haasbroek"
);

INSERT INTO tblHK (
	hkaPortfolio,
    tblUser_usrID
) VALUES (
	"Onder-Voorsitter, IT",
    2
);
    

