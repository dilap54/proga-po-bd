ALTER TABLE `workers` 
    ADD CONSTRAINT `workerToPosition` 
    FOREIGN KEY (`positionId`) REFERENCES `positions`(`positionId`) 
    ON DELETE RESTRICT 
    ON UPDATE RESTRICT;