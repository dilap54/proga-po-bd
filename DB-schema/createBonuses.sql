CREATE TABLE IF NOT EXISTS `bonuses` 
    ( `bonusId` INT NOT NULL AUTO_INCREMENT , 
        `name` VARCHAR(255) NOT NULL ,
        `description` INT , 
        `deleted` BOOLEAN NOT NULL DEFAULT FALSE , 
        PRIMARY KEY (`bonusId`)
    )