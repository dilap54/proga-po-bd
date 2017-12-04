CREATE TABLE IF NOT EXISTS `workersHistory`
    ( `workerHistoryId` INT NOT NULL AUTO_INCREMENT ,
        `workerId` INT NOT NULL ,
        `fullName` VARCHAR(255) NOT NULL ,
        `birthDay` DATE NOT NULL , 
        `gender` BOOLEAN NULL , 
        `positionId` INT , 
        `isFired` BOOLEAN NOT NULL DEFAULT FALSE, 
        `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ,
        PRIMARY KEY (`workerHistoryId`), 
        INDEX (`positionId`),
        INDEX (`workerId`)
    )