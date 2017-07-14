from functions import *
import cgi

table = 'user'
form = cgi.FieldStorage()
#username = form.getvalue("username")
username = 'stevenyeu'
connection = connect()
with connection.cursor() as cursor:
    sql = "INSERT INTO " + table + " (`userID`, `username`)" + " VALUES (DEFAULT, %s)"
    print(sql)
    cursor.execute(sql,(username))
connection.commit()
