from functions import *
import cgi


# Left out until front end works
# Get data from POST
#form = cgi.FieldStorage()
#username = form.getvalue("username")

# List all data need for query
# Need to change later
username = 'test'

# Connect to database
connection = connect()
try:
    with connection.cursor() as cursor:
        addUser(cursor, username)
    connection.commit()

finally:
    connection.close()
