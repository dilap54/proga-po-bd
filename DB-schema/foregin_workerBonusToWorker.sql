ALTER TABLE `workersBonuses` 
    ADD CONSTRAINT `workerBonusToWorker` 
    FOREIGN KEY (`workerId`) REFERENCES `workers`(`workerId`) 
    ON DELETE RESTRICT 
    ON UPDATE RESTRICT;