-- phpMyAdmin SQL Dump
-- version 4.6.5.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 02, 2017 at 12:35 AM
-- Server version: 10.1.21-MariaDB
-- PHP Version: 5.6.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tasktracker_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `group_items`
--

CREATE TABLE `group_items` (
  `itemID` varchar(255) NOT NULL,
  `userID` int(11) NOT NULL,
  `groupID` int(11) NOT NULL,
  `itemType` int(11) NOT NULL,
  `position` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `group_items`
--

INSERT INTO `group_items` (`itemID`, `userID`, `groupID`, `itemType`, `position`) VALUES
('408', 128, 1843, 1, 1),
('592ef0f477a80e3838402ae2', 128, 1847, 0, 2),
('593588d2d25e144e227bc576', 128, 1841, 0, 1),
('5967b069109610df0a2c2805', 128, 1847, 0, 3),
('596e2e409eac57e426b9bbb4', 128, 1848, 0, 0),
('5993f86d06aa99a45c758332', 128, 1847, 0, 0),
('59977406f44b3492d00d3743', 128, 1840, 0, 2),
('59c05cdad1b2059b1a623967', 128, 1841, 0, 0),
('59d3fce9397561b02792018f', 128, 1843, 0, 0),
('59dbf26a2b11f52ac7014843', 128, 1847, 0, 1),
('59e1051588ebab9537f48735', 128, 1841, 0, 2),
('59e67fc90841ebead921a89a', 128, 1841, 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `userID` int(11) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `isNight` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userID`, `username`, `isNight`) VALUES
(128, 'p4wilson@sdsc.edu', 1);

-- --------------------------------------------------------

--
-- Table structure for table `user_groups`
--

CREATE TABLE `user_groups` (
  `groupID` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `groupName` varchar(255) NOT NULL,
  `position` int(11) DEFAULT '-1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=COMPACT;

--
-- Dumping data for table `user_groups`
--

INSERT INTO `user_groups` (`groupID`, `userID`, `groupName`, `position`) VALUES
(1847, 128, 'Not Started', 0),
(1848, 128, 'New Table 1848', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `group_items`
--
ALTER TABLE `group_items`
  ADD PRIMARY KEY (`itemID`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userID`);

--
-- Indexes for table `user_groups`
--
ALTER TABLE `user_groups`
  ADD PRIMARY KEY (`groupID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `userID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=129;
--
-- AUTO_INCREMENT for table `user_groups`
--
ALTER TABLE `user_groups`
  MODIFY `groupID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1849;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
