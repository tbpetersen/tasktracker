from functions import *
import cgi

table = 'user'
form = cgi.FieldStorage()
#username = form.getvalue("username")
username = 'stevenyeu'
connection = connect()
with connection.cursor() as cursor:
    sql = "SELECT `userID` FROM `user` WHERE `username` = (%s)"
    print(sql)
    cursor.execute(sql,(username))
    result = cursor.fetchone()
    print(result)
