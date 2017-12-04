CREATE TABLE IF NOT EXISTS `workers`
    ( `workerId` INT NOT NULL AUTO_INCREMENT ,
        `fullName` VARCHAR(255) NOT NULL ,
        `birthDay` DATE NOT NULL , 
        `gender` BOOLEAN NULL , 
        `positionId` INT , 
        `isFired` BOOLEAN NOT NULL DEFAULT FALSE, 
        `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ,
        PRIMARY KEY (`workerId`), 
        INDEX (`positionId`) 
    )