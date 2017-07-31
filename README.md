# tasktracker (Zello)

A web tool integrating Trello and Zendesk APIs to view all inquiries with various viewing interactions with the task cards.

## Database

```
mysql> show tables;
+--------------------------+
| Tables_in_tasktracker_db |
+--------------------------+
| group_items              |
| user_groups              |
| users                    |
+--------------------------+

mysql> describe users;
+----------+------------------+------+-----+---------+----------------+
| Field    | Type             | Null | Key | Default | Extra          |
+----------+------------------+------+-----+---------+----------------+
| userID   | int(10) unsigned | NO   | PRI | NULL    | auto_increment |
| username | varchar(255)     | YES  |     | NULL    |                |
+----------+------------------+------+-----+---------+----------------+
2 rows in set (0.00 sec)

mysql> describe user_groups;
+-----------+------------------+------+-----+---------+----------------+
| Field     | Type             | Null | Key | Default | Extra          |
+-----------+------------------+------+-----+---------+----------------+
| gorupID   | int(10) unsigned | NO   | PRI | NULL    | auto_increment |
| userID    | int(10) unsigned | YES  |     | NULL    |                |
| groupName | varchar(255)     | YES  |     | NULL    |                |
+-----------+------------------+------+-----+---------+----------------+
3 rows in set (0.00 sec)

mysql> describe group_items;
+----------+------------------+------+-----+---------+-------+
| Field    | Type             | Null | Key | Default | Extra |
+----------+------------------+------+-----+---------+-------+
| itemID   | varchar(255)     | NO   | PRI | NULL    |       |
| userID   | int(10) unsigned | YES  |     | NULL    |       |
| groupID  | int(10) unsigned | YES  |     | NULL    |       |
| itemType | int(10) unsigned | YES  |     | NULL    |       |
| position | int(10) unsigned | YES  |     | NULL    |       |
+----------+------------------+------+-----+---------+-------+

