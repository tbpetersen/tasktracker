from functions import *
import cgi


# Left out until front end works
# Get data from POST
#form = cgi.FieldStorage()
#username = form.getvalue("username")

# List all data need for query
username = 'stevenyeu'
groupName = 'Not Done'

# connect to database
connection = connect()

try:
    with connection.cursor() as cursor:
        userID = getUserID(cursor, username)
        addGroups(cursor, userID, groupName)
    connection.commit()
finally:
    connection.close()
