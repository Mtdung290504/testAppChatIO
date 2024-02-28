CREATE DATABASE IF NOT EXISTS chat_app_test_v0 CHARACTER SET utf8 COLLATE utf8_general_ci;
USE chat_app_test_v0;

-- Bảng người dùng
CREATE TABLE IF NOT EXISTS users (
    uid VARCHAR(36) PRIMARY KEY,
    uname VARCHAR(50) UNIQUE NOT NULL,
    upw VARCHAR(50) NOT NULL
);

-- Bảng tin nhắn
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_uid VARCHAR(36) NOT NULL,
    receiver_uid VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_uid) REFERENCES users(uid),
    FOREIGN KEY (receiver_uid) REFERENCES users(uid)
);

-- bảng online users
CREATE TABLE IF NOT EXISTS online_users (
	uid VARCHAR(36) NOT NULL,
    socketid VARCHAR(20) UNIQUE NOT NULL,
    FOREIGN KEY (uid) REFERENCES users(uid)
);

DELIMITER //
	CREATE TRIGGER before_insert_users
	BEFORE INSERT ON users
	FOR EACH ROW
	BEGIN
		SET NEW.uid = UUID();
	END//
    
 	CREATE PROCEDURE register(uname VARCHAR(50), upw VARCHAR(50))
	BEGIN
		 INSERT INTO users (uname, upw) 
         VALUE (uname, upw);
	END //   
    
	CREATE PROCEDURE login(uname VARCHAR(50), upw VARCHAR(50))
	BEGIN
		SELECT uid, uname 
        FROM users
        WHERE (users.uname = uname AND users.upw = upw);
	END //

	CREATE PROCEDURE get_all_user()
	BEGIN
		SELECT uid, uname FROM users;
	END //

	CREATE PROCEDURE get_all_online_user_id()
	BEGIN
		SELECT DISTINCT uid FROM online_users;
	END //

	CREATE PROCEDURE new_message(sender_uid VARCHAR(36), receiver_uid VARCHAR(36), mess TEXT)
	BEGIN
		INSERT INTO messages (sender_uid, receiver_uid, message) 
        VALUE (sender_uid, receiver_uid, mess);
	END //

	CREATE PROCEDURE get_last_messages_between(a_uid VARCHAR(36), b_uid VARCHAR(36))
	BEGIN
		SELECT m1.message
		FROM messages m1
		INNER JOIN (
			SELECT MAX(id) AS max_id
			FROM messages
			WHERE (sender_uid = a_uid AND receiver_uid = b_uid) OR (sender_uid = b_uid AND receiver_uid = a_uid)
		) m2 ON m1.id = m2.max_id;
	END //
    
    CREATE PROCEDURE get_all_messages_between(a_uid VARCHAR(36), b_uid VARCHAR(36))
	BEGIN
		SELECT *
		FROM messages
		WHERE (sender_uid = a_uid AND receiver_uid = b_uid)
		   OR (sender_uid = b_uid AND receiver_uid = a_uid)
		ORDER BY timestamp ASC;
	END //
    
    CREATE PROCEDURE register_socket(uid VARCHAR(36), socketid VARCHAR(20))
	BEGIN
		INSERT INTO online_users (uid, socketid)
		VALUES (uid, socketid);
        
        CALL find_all_socketid_of_uid(uid);
	END //

	CREATE PROCEDURE find_all_socketid_of_uid(uid VARCHAR(36))
	BEGIN
		SELECT socketid
		FROM online_users
		WHERE online_users.uid = uid;
	END //

	CREATE PROCEDURE find_all_socketid_of_socketid(socketid VARCHAR(20))
	BEGIN
		DECLARE uid_of_socketid VARCHAR(36);
		
		SELECT uid INTO uid_of_socketid
		FROM online_users
		WHERE online_users.socketid = socketid;
		
		CALL find_all_socketid_of_uid(uid_of_socketid);
	END //
    
	CREATE PROCEDURE remove_socketid(socketid VARCHAR(20))
	BEGIN
		DECLARE uid_of_socketid VARCHAR(36);
		
		SELECT uid INTO uid_of_socketid
		FROM online_users
		WHERE online_users.socketid = socketid;
		
        DELETE FROM online_users
        WHERE online_users.socketid = socketid;
        
		CALL find_all_socketid_of_uid(uid_of_socketid);
	END //    
    
	CREATE PROCEDURE logout(uid VARCHAR(36))
	BEGIN
        DELETE FROM online_users
        WHERE online_users.uid = uid;
	END //
DELIMITER ;

-- DROP DATABASE chat_app_test_v0; 
-- use chat_app_test_v0; 
-- select*from users;
-- select*from messages;
-- select*from online_users;
-- truncate table online_users;
-- truncate table messages;
-- call login('alolldld', 'ákdkaskd')
-- call register('dung', 'mypassword');
-- call register('hai', 'mypassword');
-- call login('dung', 'mypassword');
-- call logout('10');
-- call new_message("0bcb128d-d394-11ee-a7ea-489ebdd5ea55", "1b82e30e-d394-11ee-a7ea-489ebdd5ea55", "Hellooo");
-- call new_message("1b82e30e-d394-11ee-a7ea-489ebdd5ea55", "0bcb128d-d394-11ee-a7ea-489ebdd5ea55", "Hiiiii");
-- call get_messages("0bcb128d-d394-11ee-a7ea-489ebdd5ea55", "1b82e30e-d394-11ee-a7ea-489ebdd5ea55");
-- select*from messages;
-- call getLastMessage('10');
-- insert into messages(sender_id, receiver_id, message) values ("f54e727e-d171-11ee-8e4e-489ebdd5ea55", "f54e727e-d171-11ee-8e4e-489ebdd5ea55", "test");