 CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    firstName VARCHAR(255),
    lastName VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    registrationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password VARCHAR(255) NOT NULL,
    image VARCHAR(255),
    googleId VARCHAR(255),
    googleEmail VARCHAR(255),
    googleName VARCHAR(255),
    googleProfilePicture VARCHAR(255)
);


CREATE TABLE message (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    message TEXT,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES User(id)
);

CREATE TABLE reply (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    message TEXT,
    message_id INT,
    user_id INT,
    FOREIGN KEY (message_id) REFERENCES Message(id),
    FOREIGN KEY (user_id) REFERENCES User(id)
);

CREATE TABLE video (
    id INT AUTO_INCREMENT PRIMARY KEY,
    country VARCHAR(255),
    title VARCHAR(255),
    video VARCHAR(255),
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES User(id)
);


CREATE TABLE tour (
    id INT AUTO_INCREMENT PRIMARY KEY,
    destination VARCHAR(255),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tourdate DATE,
    tourdateEnd DATE,
    tourtype JSON,
    fellowtraveler VARCHAR(255),
    aboutme VARCHAR(255),
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES User(id)
);

CREATE TABLE tourmessage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message TEXT,
    user_id INT,
    tour_id INT,
    FOREIGN KEY (user_id) REFERENCES User(id),
    FOREIGN KEY (tour_id) REFERENCES Tour(id)
);




ALTER TABLE reply CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;