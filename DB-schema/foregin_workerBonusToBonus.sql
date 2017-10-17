ALTER TABLE `workersBonuses` 
    ADD CONSTRAINT `workerBonusToBonus` 
    FOREIGN KEY (`bonusId`) REFERENCES `bonuses`(`bonusId`) 
    ON DELETE RESTRICT 
    ON UPDATE RESTRICT;