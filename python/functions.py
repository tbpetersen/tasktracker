import pymysql.cursors



def connect():
    """
     Connects to the MySQL database

     Args:
        host: Where the database is located.
        user: accoount for the database
        password: user password
        db: the database to connect to
     Return: returns a connection object

    """
    connection = pymysql.connect(host='localhost',
                             user='root',
                             password='12Sy76my',
                             db='test',
                             charset='utf8mb4',
                             cursorclass=pymysql.cursors.DictCursor)
    return connection

def addUser(cursor, username):
    sql = "INSERT INTO `user` (`userID`, `username`)  VALUES (DEFAULT, %s)"
    cursor.execute(sql,(username))

def getUserID(cursor, username):
    sql_userID = "SELECT `userID` FROM `user` WHERE `username` = (%s) "
    cursor.execute(sql_userID,(username))
    data = cursor.fetchone()
    userID = data['userID']
    return userID

def getGroupIDs(cursor, userID):
    sql_GroupID = "SELECT `groupID` FROM `user_groups` WHERE `userID` = (%s)"
    cursor.execute(sql_GroupID, (userID))
    result = cursor.fetchall()
    groupsIDs = [ data['groupID'] for data in result ]
    return groupsIDs

def addGroups(cursor, userID, groupName):
    sql = "INSERT INTO `user_groups` (`groupID`, `userID`, `groupName`) VALUES( DEFAULT, %s, %s)"
    cursor.execute(sql, (userID, groupName))
