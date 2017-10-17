ALTER TABLE `workersHistory` 
    ADD CONSTRAINT `workerHistoryToWorkers` 
    FOREIGN KEY (`workerId`) REFERENCES `workers`(`workerId`) 
    ON DELETE RESTRICT 
    ON UPDATE RESTRICT;