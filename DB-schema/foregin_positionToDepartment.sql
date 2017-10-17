ALTER TABLE `positions` 
    ADD CONSTRAINT `positionsToDepartment` 
    FOREIGN KEY (`departmentId`) REFERENCES `departments`(`departmentId`) 
    ON DELETE RESTRICT 
    ON UPDATE RESTRICT;