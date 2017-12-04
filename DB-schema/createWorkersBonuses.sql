CREATE TABLE IF NOT EXISTS `workersBonuses` 
    (   `workerBonusId` INT NOT NULL AUTO_INCREMENT,
        `bonusId` INT NOT NULL , 
        `workerId` INT NOT NULL ,
        `startDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ,
        `endDate` DATETIME ,
        PRIMARY KEY (`workerBonusId`) ,
        INDEX(`bonusId`) ,
        INDEX(`workerId`)
    )