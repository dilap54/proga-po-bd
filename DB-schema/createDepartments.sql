CREATE TABLE IF NOT EXISTS `departments` 
    ( `departmentId` INT NOT NULL AUTO_INCREMENT , 
        `name` VARCHAR(255) NOT NULL , 
        `abolished` BOOLEAN NOT NULL DEFAULT FALSE , 
        PRIMARY KEY (`departmentId`)
    )