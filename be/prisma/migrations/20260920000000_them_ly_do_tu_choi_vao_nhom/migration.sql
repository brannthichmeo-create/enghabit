-- Lý do trưởng nhóm từ chối một yêu cầu vào nhóm, cho tab "Chờ duyệt" của người xin vào.
--
-- Chỉ THÊM một cột cho phép NULL nên chạy an toàn trên DB dùng chung. Các yêu cầu đã bị
-- từ chối từ trước giữ NULL — giao diện hiện "Trưởng nhóm không để lại lý do" cho chúng.

-- AlterTable
ALTER TABLE `group_join_requests` ADD COLUMN `reject_reason` VARCHAR(300) NULL;
