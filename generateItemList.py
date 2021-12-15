# This file is used to convert the item list inside of Stockpiler into options for the Discord Bot
import csv

outputData = []
with open('ItemNumbering.csv') as csv_file:
    csv_reader = csv.reader(csv_file, delimiter=',')
    line_count = 0
    for row in csv_reader:
        if line_count > 1:
            outputData.append(row[3])
        line_count += 1

print(outputData)