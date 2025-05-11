CREATE DATABASE GAMESTORE;
USE GAMESTORE;
CREATE TABLE USERS (
    User_Id INT AUTO_INCREMENT PRIMARY KEY,
    User_Email VARCHAR(255) NOT NULL UNIQUE,
    User_Password VARCHAR(255) NOT NULL,
    User_Name VARCHAR(255)     
);

CREATE TABLE Products (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  Product_Name VARCHAR(255),
  Product_description TEXT,
  Image_Path VARCHAR(255),
  Genre varchar(200) default('Action'),
  Price DECIMAL(10, 2)
);
Drop Table Products;
INSERT INTO Products (Product_Name, Image_Path, Price, Product_description, Genre)
VALUES 
('Shadow Blade', 'Game21.jpg', 29.99, 'A fast-paced ninja adventure game.', 'Action'),
('Skyward Quest', 'Game26.jpg', 24.99, 'Explore floating islands and ancient secrets.', 'Simulator'),
('Pixel Racer', 'Game25.jpeg', 19.99, 'Retro-style racing with modern mechanics.', 'Action'),
('Zombie Mayhem', 'Game21.jpg', 14.99, 'Survive waves of undead in post-apocalyptic chaos.', 'Action'),
('Space Raiders', 'Game15.jpeg', 34.99, 'Defend Earth from alien invaders.', 'Action'),
('Magic Realms', 'Game14.jpeg', 39.99, 'Cast spells and conquer fantasy kingdoms.', 'Simulator'),
('Cyber Pulse', 'Game12.jpg', 27.50, 'High-tech battles in a cyberpunk world.', 'Action'),
('Battlefront Zero', 'Game11.jpg', 31.00, 'Intense multiplayer warfare on futuristic maps.', 'Action'),
('Dungeon Depths', 'Game10.png', 17.75, 'Delve into dark dungeons filled with monsters.', 'Simulator'),
('Ghost Hunt', 'Game9.jpg', 21.45, 'Track and trap ghosts in haunted locations.', 'Action'),
('Ocean Drift', 'Game8.jpg', 22.99, 'Race jet-powered boats through tropical waters.', 'Simulator'),
('Alien Rescue', 'Game7.jpg', 28.00, 'Save alien civilizations from destruction.', 'Action'),
('Dragon Siege', 'Game6.jpg', 33.25, 'Command dragons in epic castle sieges.', 'Action'),
('Code Runner', 'Game5.jpg', 15.99, 'Hack systems and escape surveillance.', 'Simulator'),
('Galaxy Warzone', 'Game4.jpg', 30.00, 'Lead your fleet in intergalactic combat.', 'Action'),
('Jungle Escape', 'Game3.jpg', 18.50, 'Solve puzzles and survive the wild jungle.', 'Simulator'),
('Ninja Rebirth', 'Game2.jpg', 26.70, 'Revive the ancient art of shadow warfare.', 'Action'),
('Mech Assault', 'Game5.jpg', 32.00, 'Control giant mechs and destroy enemy bases.', 'Simulator');


insert into Products(Product_Name,Image_Path,Price,Genre)
Values('Game 1','DB Project.jpg',23.0,'Romantic'),
('Game 1','DB Project.jpg',23.0,'Romantic'),
('Game 1','DB Project.jpg',23.0,'Romantic'),
('Game 1','DB Project.jpg',23.0,'Romantic'),
('Game 1','DB Project.jpg',23.0,'Romantic'),
('Game 1','DB Project.jpg',23.0,'Romantic'),
('Game 1','DB Project.jpg',23.0,'Romantic'),
('Game 1','DB Project.jpg',23.0,'Romantic');

select *from USERS;

