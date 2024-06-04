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
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE reply (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    message TEXT,
    message_id INT,
    user_id INT,
    FOREIGN KEY (message_id) REFERENCES Message(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE video (
    id INT AUTO_INCREMENT PRIMARY KEY,
    country VARCHAR(255),
    title VARCHAR(255),
    video VARCHAR(255),
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES user(id)
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
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE tourmessage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message TEXT,
    user_id INT,
    tour_id INT,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (tour_id) REFERENCES tour(id)
);


CREATE TABLE tourreply (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message TEXT,
    messagetype INT,
    user_id INT,
    tourmessage_id INT,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (tourmessage_id) REFERENCES tourmessage(id)
 );

CREATE TABLE votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    message_id INT,
    vote_type ENUM('thumb_up', 'thumb_down'),
    vote_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (message_id) REFERENCES message(id),
    UNIQUE (user_id, message_id) -- Ensure a user can only vote once per message
);


ALTER TABLE reply CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;