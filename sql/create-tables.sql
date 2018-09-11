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
  `usrVerified` boolean NOT NULL,
  `usrIsHK` boolean NOT NULL,
  `tblBedieningTable_talID` INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`usrID`, `tblBedieningTable_talID`),
  INDEX `fk_tblUser_tblBedieningTable1_idx` (`tblBedieningTable_talID` ASC),
  CONSTRAINT `fk_tblUser_tblBedieningTables1`
    FOREIGN KEY (`tblBedieningTable_talID`)
    REFERENCES `dbSonopApp`.`tblBedieningTable` (`talID`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
  ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;

-- -----------------------------------------------------
-- Table `dbERPCOIN`.`tblUser`
-- -----------------------------------------------------
-- Description: Stores basic informtion about an user.
-- usrWalletAddress: The address of the user's blockchain wallet.
-- usrLastPointTime: The time when the user previously sent his coordinate
CREATE TABLE IF NOT EXISTS `dbSonopApp`.`tblHK` (
  `hkaID` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `hkaPortfolio` VARCHAR(50) NOT NULL,
  `tblUser_usrID` INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`hkaID`, `tblUser_usrID`),
  INDEX `fk_tblHK_tblUser1_idx` (`tblUser_usrID` ASC),
  CONSTRAINT `fk_tblHK_tblUser1`
    FOREIGN KEY (`tblUser_usrID`)
    REFERENCES `dbSonopApp`.`tblUser` (`usrID`)
    ON DELETE NO ACTION
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
  `tblHK_hkaID` INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`annID`, `tblHK_hkaID`),
  INDEX `fk_tblAnnouncement_tblHK1_idx` (`tblHK_hkaID` ASC),
  CONSTRAINT `fk_tblAnnouncement_tblHK1`
    FOREIGN KEY (`tblHK_hkaID`)
    REFERENCES `dbSonopApp`.`tblHK` (`hkaID`)
    ON DELETE NO ACTION
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
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;

CREATE TABLE IF NOT EXISTS `dbSonopApp`.`tblBedieningTable` (
  `talID` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `talName` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`talID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
