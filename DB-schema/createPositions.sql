CREATE TABLE IF NOT EXISTS `os`.`positions` 
    ( `positionId` INT NOT NULL AUTO_INCREMENT , 
        `name` VARCHAR(255) NOT NULL ,
        `departmentId` INT NOT NULL , 
        `abolished` BOOLEAN NOT NULL DEFAULT FALSE , 
        PRIMARY KEY (`positionId`), 
        INDEX (`departmentId`) 
    )