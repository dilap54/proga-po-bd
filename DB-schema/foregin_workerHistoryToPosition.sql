ALTER TABLE `workersHistory` 
    ADD CONSTRAINT `workerHistoryToPosition` 
    FOREIGN KEY (`positionId`) REFERENCES `positions`(`positionId`) 
    ON DELETE RESTRICT 
    ON UPDATE RESTRICT;