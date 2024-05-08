 CREATE TABLE User (
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

/* CREATE TABLE User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    firstName VARCHAR(255),
    lastName VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    registrationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password VARCHAR(255) NOT NULL,
    image VARCHAR(255)
); */

CREATE TABLE Message (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATETIME,
    message TEXT,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES User(id)
);

CREATE TABLE Reply (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATETIME,
    message TEXT,
    message_id INT,
    user_id INT,
    FOREIGN KEY (message_id) REFERENCES Message(id),
    FOREIGN KEY (user_id) REFERENCES User(id)
);

CREATE TABLE Video (
    id INT AUTO_INCREMENT PRIMARY KEY,
    country VARCHAR(255),
    title VARCHAR(255),
    video VARCHAR(255),
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES User(id)
);