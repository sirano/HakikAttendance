-- 치팅시트 : http://www.incodom.kr/DB_-_%EB%8D%B0%EC%9D%B4%ED%84%B0_%ED%83%80%EC%9E%85/MYSQL
-- 자료형 : https://devhints.io/mysql

----
-- Table structure for table `members`
----

CREATE TABLE `members` (
    
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `name` varchar(10) NOT NULL,
    `phoneNumber` varchar(15) ,
    `home` text ,
    `birthday` varchar(15),
    `longAbsentee` tinyint(1) DEFAULT 0,
    `team_id` int(11) NOT NULL,
    PRIMARY KEY (`id`)
    
);

--
-- Dumping data for table `members`
--

INSERT INTO `members` (name,team_id) VALUES ('member1', 1);
INSERT INTO `members` (name,team_id) VALUES ('member2', 1);
INSERT INTO `members` (name,team_id) VALUES ('member3', 1);
INSERT INTO `members` (name,team_id) VALUES ('member4', 1);
INSERT INTO `members` (name,team_id) VALUES ('member5', 2);
INSERT INTO `members` (name,team_id) VALUES ('member6', 2);
INSERT INTO `members` (name,team_id) VALUES ('member7', 2);
INSERT INTO `members` (name,team_id) VALUES ('member8', 2);
INSERT INTO `members` (name,team_id) VALUES ('member9', 3);
INSERT INTO `members` (name,team_id) VALUES ('member10', 3);
INSERT INTO `members` (name,team_id) VALUES ('member11', 3);
INSERT INTO `members` (name,team_id) VALUES ('member12', 3);
INSERT INTO `members` (name,team_id) VALUES ('member13', 4);
INSERT INTO `members` (name,team_id) VALUES ('member14', 4);
INSERT INTO `members` (name,team_id) VALUES ('member15', 4);
INSERT INTO `members` (name,team_id) VALUES ('member16', 4);
INSERT INTO `members` (name,team_id) VALUES ('member17', 5);


----
-- Table structure for table `teams`
----

CREATE TABLE `teams` (
    
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `teamName` varchar(10) NOT NULL,
    `teacher` varchar(10) NOT NULL,
    `photo` text,
    `teamInfo` text,
    PRIMARY KEY (`id`)
    
);

--
-- Dumping data for table `teams`
--

INSERT INTO `teams` (teamName,teacher,photo) VALUES ('team1', 'teacher1','/img/1.jpg' );
INSERT INTO `teams` (teamName,teacher,photo) VALUES ('team2', 'teacher2','/img/2.jpg' );
INSERT INTO `teams` (teamName,teacher,photo) VALUES ('team3', 'teacher3','/img/3.jpg' );
INSERT INTO `teams` (teamName,teacher,photo) VALUES ('team5', 'teacher5','/img/5.jpg' );



----
-- Table structure for table `SI_link`
----

CREATE TABLE `SI_link` (
    `mem_id` int(11) NOT NULL,
    `SI_id` int(11) NOT NULL,
    
);

--
-- Dumping data for table `SI_link`
--
INSERT INTO `SI_link` (mem_id,SI_id) VALUES (1,1 );

----
-- Table structure for table `specialInfos`
----

CREATE TABLE `specialInfos` (
    
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `created` datetime NOT NULL,
    `title` varchar(30) NOT NULL,
    `description` text,
    `author` varchar(30),
    PRIMARY KEY (`id`)
    
);

--
-- Dumping data for table `specialInfos`
-- select * from members LEFT JOIN ( SI_link LEFT JOIN specialInfos ON SI_link.SI_id=specialInfos.id) ON members.id=SI_link.mem_id;
--
INSERT INTO `specialInfos` (created,title) VALUES (NOW(), 'TEST LOG' );


----
-- Table structure for table `weekly`
----

CREATE TABLE `weekly` (
    
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `week` float(7,1) NOT NULL, -- 년도년도월월.1 , ex : 202004.2 
    `mem_id` int(11) NOT NULL ,
    `attendance` tinyint(1) DEFAULT 0,
    `bibleRead` tinyint(3) DEFAULT 0,
    `bibleMemorise` tinyint(1) DEFAULT 0,
    PRIMARY KEY (`id`)
);

--
-- Dumping data for table `weekly`
--

INSERT INTO `weekly` (week,mem_id) VALUES (140412.1, 1 );

