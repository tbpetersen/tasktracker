from functions import *
import cgi


# Left out until front end works
# Get data from POST
#form = cgi.FieldStorage()
#username = form.getvalue("username")

# List all data need for query
username = 'stevenyeu'

# connect to database
connection = connect()

try:
    with connection.cursor() as cursor:
        # get userID
        userID = getUserID(cursor, username)

        # Get groupIDs
        sql_GroupID = "SELECT `groupID` FROM `user_groups` WHERE `userID` = (%s)"
        cursor.execute(sql_GroupID, (userID))
        result = cursor.fetchall()
        groupsIDs = [ data['groupID'] for data in result ]
        
finally:
    print(groupsIDs)
    connection.close()
