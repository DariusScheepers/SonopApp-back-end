SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema dbERPCOIN
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `dbSonopApp` DEFAULT CHARACTER SET latin1 ;
USE `dbSonopApp` ;

-- -----------------------------------------------------
-- Table `dbERPCOIN`.`tblUser`
-- -----------------------------------------------------
-- Description: Stores basic informtion about an user.
-- usrWalletAddress: The address of the user's blockchain wallet.
-- usrLastPointTime: The time when the user previously sent his coordinate
CREATE TABLE IF NOT EXISTS `dbSonopApp`.`tblUser` (
  `usrID` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `usrUsername` VARCHAR(50) NOT NULL,
  `usrEmailAddress` VARCHAR(100) NOT NULL,
  `usrPassword` VARCHAR(60) NOT NULL,
  `usrName` VARCHAR(40) NOT NULL,
  `usrSurname` VARCHAR(40) NOT NULL,
  `usrStudentNumber` VARCHAR(10) NOT NULL,
  `usrFirstYearYear` int NOT NULL,
  `usrIsSemi` boolean NOT NULL,
  `usrVerified` boolean NOT NULL,
  `usrIsHK` boolean NOT NULL,
  `tblBedieningTable_talID` INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`usrID`, `tblBedieningTable_talID`),
  INDEX `fk_tblUser_tblBedieningTable1_idx` (`tblBedieningTable_talID` ASC),
  CONSTRAINT `fk_tblUser_tblBedieningTables1`
    FOREIGN KEY (`tblBedieningTable_talID`)
    REFERENCES `dbSonopApp`.`tblBedieningTable` (`talID`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
  ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;

-- -----------------------------------------------------
-- Table `dbERPCOIN`.`tblUser`
-- -----------------------------------------------------
-- Description: Stores basic informtion about an user.
-- usrWalletAddress: The address of the user's blockchain wallet.
-- usrLastPointTime: The time when the user previously sent his coordinate
CREATE TABLE IF NOT EXISTS `dbSonopApp`.`tblAnnouncement` (
  `annID` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `annTitle` VARCHAR(50) NOT NULL,
  `annMessage` VARCHAR(10000) NOT NULL,
  `annDatePosted` BIGINT NOT NULL,
  `annPriority` BOOLEAN NOT NULL,
  `tblUser_usrID` INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`annID`, `tblUser_usrID`),
  INDEX `fk_tblAnnouncement_tblUser1_idx` (`tblUser_usrID` ASC),
  CONSTRAINT `fk_tblAnnouncement_tblUser1`
    FOREIGN KEY (`tblUser_usrID`)
    REFERENCES `dbSonopApp`.`tblUser` (`usrID`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;

CREATE TABLE IF NOT EXISTS `dbSonopApp`.`tblWeekendSignIn` (
  `wsiID` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `wsiFridayDinner` boolean,
  `wsiSaturdayBrunch` boolean,
  `wsiSaturdayDinner` boolean,
  `wsiSundayBreakfast` boolean,
  `wsiSundayLunch` boolean,
  `wsiSundayDinner` boolean,
  `tblUser_usrID` INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`wsiID`, `tblUser_usrID`),
  INDEX `fk_tblWeekendSignIn_tblUser1_idx` (`tblUser_usrID` ASC),
  CONSTRAINT `fk_tblWeekendSignIn_tblUser1`
    FOREIGN KEY (`tblUser_usrID`)
    REFERENCES `dbSonopApp`.`tblUser` (`usrID`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;

CREATE TABLE IF NOT EXISTS `dbSonopApp`.`tblBedieningTable` (
  `talID` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `talName` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`talID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;

CREATE TABLE IF NOT EXISTS `dbSonopApp`.`tblWeeklySignOut` (
  `wsoID` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `wsoMondayLunch` INT(2) UNSIGNED, #0 = permanet sign out #1 = sign out #2 = signed in
  `wsoMondayDinner` INT(2) UNSIGNED,
  `wsoTuesdayLunch` INT(2) UNSIGNED,
  `wsoTuesdayDinner` INT(2) UNSIGNED,
  `wsoWednesdayLunch` INT(2) UNSIGNED,
  `wsoWednesdayDinner` INT(2) UNSIGNED,
  `wsoThursdayLunch` INT(2) UNSIGNED,
  `wsoThursdayDinner` INT(2) UNSIGNED,
  `wsoFridayLunch` INT(2) UNSIGNED,
  `tblUser_usrID` INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`wsoID`, `tblUser_usrID`),
  INDEX `fk_tblWeeklySignOut_tblUser1_idx` (`tblUser_usrID` ASC),
  CONSTRAINT `fk_tblWeeklySignOut_tblUser1`
    FOREIGN KEY (`tblUser_usrID`)
    REFERENCES `dbSonopApp`.`tblUser` (`usrID`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
