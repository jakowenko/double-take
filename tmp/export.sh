#!/bin/sh
                                                                              
# Specify your database file name                                         
DATABASE_FILE="/Users/svk/Documents/Projects/double-take/.storage/database.db"                                     
                                                                            
# Get list of tables from the SQLite database                             
TABLES=$(sqlite3 "$DATABASE_FILE" ".tables")                   


sqlite3 -readonly "$DATABASE_FILE" .schema | grep -v 'INDEX\|sqlite_'
# Loop through each table and export the last 10 rows                     
for TABLE in $TABLES; do                                          
   sqlite3 -readonly "$DATABASE_FILE" -cmd ".mode insert" "select * from $TABLE order by id desc limit 3"
done  