import pymysql.cursors

def connect():
    connection = pymysql.connect(host='localhost',
                             user='root',
                             password='12Sy76my',
                             db='test',
                             charset='utf8mb4',
                             cursorclass=pymysql.cursors.DictCursor)
    return connection
