import os
import os.path
import time
import numpy
from PIL import ImageTk, ImageGrab, Image
import logging
import datetime
import glob
import cv2
import numpy as np
import csv
import re
from requests.sessions import Request
import requests
import threading


global stockpilename
global NewStockpileName
global StockpileNameEntry
global CurrentStockpileName
global stockpilecontents

class items(object):
	data = []
	numbers = (('CheckImages//num0.png', "0"), ('CheckImages//num1.png', "1"), ('CheckImages//num2.png', "2"),
			   ('CheckImages//num3.png', "3"), ('CheckImages//num4.png', "4"), ('CheckImages//num5.png', "5"),
			   ('CheckImages//num6.png', "6"), ('CheckImages//num7.png', "7"), ('CheckImages//num8.png', "8"),
			   ('CheckImages//num9.png', "9"), ('CheckImages//numk.png', "k+"))
	stockpilecontents = []
	sortedcontents = []
	ThisStockpileName = ""
	FoundStockpileTypeName = ""

if not os.path.exists("./logs"):
	os.makedirs("./logs")

logfilename = datetime.datetime.now().strftime("%Y-%m-%d-%H%M%S")
logfilename = "logs/Stockpiler-log-" + logfilename + ".txt"
logging.basicConfig(filename=logfilename, format='%(name)s - %(levelname)s - %(message)s', level=logging.INFO)
print("Log file created: " + logfilename)
logging.info(str(datetime.datetime.now()) + ' Log Created')


def get_file_directory(file):
	return os.path.dirname(os.path.abspath(file))


# Log cleanup of any contents of logs folder older than 7 days
now = time.time()
cutoff = now - (7 * 86400)
files = os.listdir(os.path.join(get_file_directory(__file__), "logs"))
file_path = os.path.join(get_file_directory(__file__), "logs/")
for xfile in files:
	if os.path.isfile(str(file_path) + xfile):
		t = os.stat(str(file_path) + xfile)
		c = t.st_ctime
		if c < cutoff:
			os.remove(str(file_path) + xfile)
			logging.info(str(datetime.datetime.now()) + " " + str(xfile) + " log file deleted")

Version = "1b"

# global counter
# global threadnum
# 
# counter = 1
# threadnum = 1


# Load contents of ItemNumbering.csv into items.data
# Adds all fields (columns) even though only a few are used
with open('ItemNumbering.csv', 'rt') as f_input:
	csv_input = csv.reader(f_input, delimiter=',')
	# Skips first line
	header = next(csv_input)
	# Skips reserved line
	reserved = next(csv_input)
	for rowdata in csv_input:
		items.data.append(rowdata)


def SearchImage(image):
	# "image" is the file path
	global stockpilename
	global NewStockpileName
	global CurrentStockpileName
	global threadnum

	try:
		# OKAY, so you'll have to grab the whole screen, detect that thing in the upper left, then use that as a basis
		# for cropping that full screenshot down to just the foxhole window
		screen = cv2.imread(image, cv2.IMREAD_GRAYSCALE)

		numbox = cv2.imread('CheckImages//StateOf.png', cv2.IMREAD_GRAYSCALE)

		res = cv2.matchTemplate(screen, numbox, cv2.TM_CCOEFF_NORMED)
		threshold = .95
		if np.amax(res) > threshold:
			stateloc = np.where(res >= threshold)
			statey = stateloc[0].astype(int) - 35
			statex = stateloc[1].astype(int) - 35

			screen = screen[int(statey):int(statey) + 1079, int(statex):int(statex) + 1919]
			print("It thinks it found the window position in SearchImage and is grabbing location: X:", str(statex),
				  " Y:", str(statey))
		else:
			print("State of the War not found in SearchImage.  It may be covered up or you're not on the map.")
	except Exception as e:
		print("Exception: ", e)
		print("Failed to grab the screen in SearchImage")
		logging.info(str(datetime.datetime.now()) + " Failed Grabbing the screen in SearchImage " + str(e))
	garbage = "blah"
	# args = (screen, garbage)
	# # Threading commands are generated via text since each thread needs a distinct name, created using threadcounter
	# threadcounter = "t" + str(threadnum)
	# # print(threadcounter)
	# logging.info(str(datetime.datetime.now()) + " Starting scan thread: " + str(threadcounter))
	# threadingthread = threadcounter + " = threading.Thread(target = ItemScan, args = args)"
	# threadingdaemon = threadcounter + ".daemon = True"
	# threadingstart = threadcounter + ".start()"
	# # print(threadnum)
	# exec(threadingthread)
	# exec(threadingdaemon)
	# exec(threadingstart)
	# threadnum += 1
	ItemScan(screen, garbage)


def ItemScan(screen, garbage):
	global stockpilecontents
	findshirtC = cv2.imread('CheckImages//Default//86C.png', cv2.IMREAD_GRAYSCALE)
	findshirt = cv2.imread('CheckImages//Default//86.png', cv2.IMREAD_GRAYSCALE)
	try:
		resC = cv2.matchTemplate(screen, findshirtC, cv2.TM_CCOEFF_NORMED)
	except Exception as e:
		print("Exception: ", e)
		print("Looks like you're missing the shirt crate in ItemScan")
		logging.info(str(datetime.datetime.now()) + " Maybe missing shirt crate icon in ItemScan " + str(e))
	try:
		res = cv2.matchTemplate(screen, findshirt, cv2.TM_CCOEFF_NORMED)
	except Exception as e:
		print("Exception: ", e)
		print("Looks like you're missing the individual shirts in ItemScan")
		logging.info(str(datetime.datetime.now()) + " Maybe missing individual shirt icon in ItemScan " + str(e))
	threshold = .99
	FoundShirt = False
	try:
		if np.amax(res) > threshold:
			print("Found Shirts")
			y, x = np.unravel_index(res.argmax(), res.shape)
			FoundShirt = True
	except Exception as e:
		print("Exception: ", e)
		print("Don't have the individual shirts icon or not looking at a stockpile in ItemScan")
		logging.info(str(datetime.datetime.now()) + " Don't have the individual shirts icon or not looking at a stockpile in ItemScan " + str(e))
	try:
		if np.amax(resC) > threshold:
			print("Found Shirt Crate")
			y, x = np.unravel_index(resC.argmax(), resC.shape)
			FoundShirt = True
	except Exception as e:
		print("Exception: ", e)
		print("Don't have the shirt crate icon or not looking at a stockpile in ItemScan")
		logging.info(str(datetime.datetime.now()) + " Don't have the shirt crate icon or not looking at a stockpile in ItemScan " + str(e))
	if not FoundShirt:
		print("Found nothing.  Either don't have shirt icon(s) or not looking at a stockpile in ItemScan")
		y = 0
		x = 0

	# COMMENT OUT IF TESTING A SPECIFIC IMAGE
	if y == x == 0:
		stockpile = screen
	else:
		stockpile = screen[y - 32:1080, x - 11:x + 389]

	# Image clips for each type of stockpile should be in this array below
	StockpileTypes = (('CheckImages//Seaport.png', 'Seaport', 0), ('Checkimages//StorageDepot.png', 'Storage Depot', 1),
					  ('Checkimages//Outpost.png', 'Outpost', 2), ('Checkimages//Townbase.png', 'Town Base', 3),
					  ('Checkimages//RelicBase.png', 'Relic Base', 4),
					  ('Checkimages//BunkerBase.png', 'Bunker Base', 5),
					  ('Checkimages//Encampment.png', 'Encampment', 6),
					  ('Checkimages//SafeHouse.png', 'Safe House', 7))
	# Check cropped stockpile image for each location type image
	for image in StockpileTypes:
		try:
			findtype = cv2.imread(image[0], cv2.IMREAD_GRAYSCALE)
			# if menu.debug.get() == 1:
			# 	cv2.imshow("Looking for this",findtype)
			# 	cv2.waitKey(0)
			res = cv2.matchTemplate(stockpile, findtype, cv2.TM_CCOEFF_NORMED)
			# Threshold is a bit lower for types as they are slightly see-thru
			typethreshold = .95
			# print("Checking:", image[1])
			if np.amax(res) > typethreshold:
				y, x = np.unravel_index(res.argmax(), res.shape)
				FoundStockpileType = image[2]
				FoundStockpileTypeName = image[1]
				# print(image[1])
				if image[1] == "Seaport" or image[1] == "Storage Depot":
					findtab = cv2.imread('CheckImages//Tab.png', cv2.IMREAD_GRAYSCALE)
					res = cv2.matchTemplate(stockpile, findtab, cv2.TM_CCOEFF_NORMED)
					tabthreshold = .99
					if np.amax(res) > tabthreshold:
						print("Found the Tab")
						y, x = np.unravel_index(res.argmax(), res.shape)
						# Seaports and Storage Depots have the potential to have named stockpiles, so grab the name
						stockpilename = stockpile[y - 5:y + 17, x - 150:x - 8]
						# Make a list of all current stockpile name images
						currentstockpiles = glob.glob("Stockpiles/*.png")
						# print(currentstockpiles)
						found = 0
						for image in currentstockpiles:
							stockpilelabel = cv2.imread(image, cv2.IMREAD_GRAYSCALE)
							if not image.endswith("image.png"):
								res = cv2.matchTemplate(stockpilename, stockpilelabel, cv2.TM_CCOEFF_NORMED)
								threshold = .99
								flag = False
								if np.amax(res) > threshold:
									# Named stockpile is one already seen
									found = 1
									ThisStockpileName = (image[11:(len(image) - 4)])
						if found != 1:
							################ UNRECOGNIZED NAME, CROPPED IMAGE CALLED stockpilename ################
							################ COULD CALL newstockpopup TO GET NAME IMAGE, THEN PASS ORIGINAL IMAGE BACK TO SEARCH IMAGE ################
							newstockpopup(stockpilename)
							if NewStockpileName == "" or NewStockpileName.lower() == "public":
								ThisStockpileName = "TheyLeftTheStockpileNameBlank"
							else:
								# NewStockpileFilename = 'Stockpiles//' + NewStockpileName + '.png'
								# It's a new stockpile, so save an images of the name as well as the cropped stockpile itself
								cv2.imwrite('Stockpiles//' + NewStockpileName + '.png', stockpilename)
								ThisStockpileName = NewStockpileName
					else:
						# It's not a named stockpile, so just call it by the type of location (Bunker Base, Encampment, etc)
						ThisStockpileName = FoundStockpileTypeName
				else:
					# It's not a named stockpile, so just call it by the type of location (Bunker Base, Encampment, etc)
					ThisStockpileName = FoundStockpileTypeName
				break
			else:
				# print("Didn't find",image[1])
				FoundStockpileType = "None"
				ThisStockpileName = "None"
				pass
		except Exception as e:
			print("Exception: ", e)
			print("Probably not looking at a stockpile or don't have the game open.  Looked for: ", str(image))
			FoundStockpileType = "None"
			ThisStockpileName = "None"
			logging.info(str(datetime.datetime.now()) + " Probably not looking at a stockpile or don't have the game open.")
			logging.info(str(datetime.datetime.now()) + "Looked for: ", str(image) + str(e))
			pass

	# These stockpile types allow for crates (ie: Seaport)
	CrateList = [0, 1]
	# These stockpile types only allow individual items (ie: Bunker Base)
	SingleList = [2, 3, 4, 5, 6, 7]

	start = datetime.datetime.now()

	print(ThisStockpileName)
	if ThisStockpileName == "TheyLeftTheStockpileNameBlank":
		pass
	else:
		folder = "CheckImages//Default//"
		if ThisStockpileName != "None":
			if FoundStockpileType in CrateList:
				print("Crate Type")
				# Grab all the crate CheckImages
				StockpileImages = [(str(item[0]), folder + str(item[0]) + "C.png", (item[3] + " Crate"), item[8], item[12]) for item in items.data]
				# Grab all the individual vehicles and shippables
				StockpileImagesAppend = [(str(item[0]), folder + str(item[0]) + ".png", item[3], item[8], item[11]) for item in items.data if (str(item[9]) == "7") or (str(item[9]))]
				StockpileImages.extend(StockpileImagesAppend)
				#print("Checking for:", StockpileImages)
			elif FoundStockpileType in SingleList:
				print("Single Type")
				# Grab all the individual items
				# for item in range(len(items.data)):
				# 	print(item)
				StockpileImages = [(str(item[0]), folder + str(item[0]) + ".png", item[3], item[8], item[11]) for item in items.data]
				#print("Checking for:", StockpileImages)
			else:
				print("No idea what type...")

			stockpilecontents = []
			checked = 0
			#print("StockpileImages", StockpileImages)
			for image in StockpileImages:
				checked += 1
				if str(image[4]) == '1':
					if os.path.exists(image[1]):
						try:
							findimage = cv2.imread(image[1], cv2.IMREAD_GRAYSCALE)
							res = cv2.matchTemplate(stockpile, findimage, cv2.TM_CCOEFF_NORMED)
							threshold = .99
							flag = False
							if np.amax(res) > threshold:
								flag = True
								y, x = np.unravel_index(res.argmax(), res.shape)
								# Found a thing, now find amount
								numberlist = []
								for number in items.numbers:
									findnum = cv2.imread(number[0], cv2.IMREAD_GRAYSCALE)
									# Clip the area where the stock number will be
									numberarea = stockpile[y+8:y+28, x+45:x+87]
									resnum = cv2.matchTemplate(numberarea, findnum, cv2.TM_CCOEFF_NORMED)
									threshold = .90
									numloc = np.where(resnum >= threshold)
									# It only looks for up to 3 of each number for each item, since after that it would be a "k+" scenario, which never happens in stockpiles
									# This will need to be changed to allow for more digits whenever it does in-person looks at BB stockpiles and such, where it will show up to 5 digits
									if len(numloc[1]) > 0:
										numberlist.append(tuple([numloc[1][0],number[1]]))
									if len(numloc[1]) > 1:
										numberlist.append(tuple([numloc[1][1],number[1]]))
									if len(numloc[1]) > 2:
										numberlist.append(tuple([numloc[1][2],number[1]]))
									# Sort the list of numbers by position closest to the left, putting the numbers in order by extension
									numberlist.sort(key=lambda y: y[0])

								# If the number ends in a K, it just adds 000 since you don't know if that's 1001 or 1999
								# k+ never happens in stockpiles, so this only affects town halls, bunker bases, etc
								if len(numberlist) == 1:
									quantity = int(str(numberlist[0][1]))
								elif len(numberlist) == 2:
									if numberlist[1][1] == "k+":
										quantity = int(str(numberlist[0][1]) + "000")
									else:
										quantity = int(str(numberlist[0][1]) + (str(numberlist[1][1])))
								elif len(numberlist) == 3:
									if numberlist[2][1] == "k+":
										quantity = int(str(numberlist[0][1]) + (str(numberlist[1][1])) + "000")
									else:
										quantity = int(str(numberlist[0][1]) + (str(numberlist[1][1])) + str(numberlist[2][1]))
								elif len(numberlist) == 4:
									if numberlist[3][1] == "k+":
										quantity = int(str(numberlist[0][1]) + (str(numberlist[1][1])) + str(numberlist[2][1]) + "000")
									else:
										quantity = int(str(numberlist[0][1]) + (str(numberlist[1][1])) + str(numberlist[2][1]) + str(numberlist[3][1]))
								# place shirts first, since they're always at the top of every stockpile
								if image[0] == "86":
									itemsort = 0
								# bunker supplies next
								elif image[0] == "93":
									itemsort = 1
								# garrison supplies last
								elif image[0] == "90":
									itemsort = 2
								elif image[3] != "Vehicle" and image[3] != "Shippables":
									itemsort = 5
								elif image[3] == "Vehicle":
									itemsort = 10
								else:
									itemsort = 15
								if image[1][(len(image[1])-5):(len(image[1])-4)] == "C":
									stockpilecontents.append(list((image[0], image[2], quantity, itemsort, 1)))
								else:
									stockpilecontents.append(list((image[0], image[2], quantity, itemsort, 0)))
						except Exception as e:
							print("Exception: ", e)
							pass

			items.sortedcontents = list(sorted(stockpilecontents, key=lambda x: (x[3], x[4], -x[2])))
			# Here's where we sort stockpilecontents by category, then number, so they spit out the same as screenshot
			# Everything but vehicles and shippables first, then single vehicle, then crates of vehicles, then single shippables, then crates of shippables
			if ThisStockpileName in ("Seaport","Storage Depot","Outpost","Town Base","Relic Base","Bunker Base","Encampment","Safe House"):
				ThisStockpileName = "Public"

			################ TALK TO STOREMAN HERE ################
			# if menu.updateBot.get() == 1 and ThisStockpileName != "Public":
			# 	requestObj = {
			# 		"password": menu.BotPassword.get(),
			# 		"name": ThisStockpileName,
			# 		"guildID": menu.BotGuildID.get()
			# 	}
			# 	data = []
			# 	for x in items.sortedcontents:
			# 		data.append([x[1], x[2]])
			# 	requestObj["data"] = data
			#
			# 	try:
			# 		r = requests.post(menu.BotHost.get(), json=requestObj)
			# 		response = r.json()
			#
			# 		storemanBotPrefix = "[Storeman Bot Link]: "
			# 		if (response["success"]): print(storemanBotPrefix + "Scan of " + ThisStockpileName + " sent to server successfully")
			# 		elif (response["error"] == "empty-stockpile-name"): print(storemanBotPrefix + "Stockpile name is invalid. Perhaps the stockpile name was not detected or empty.")
			# 		elif (response["error"] == "invalid-password"): print(storemanBotPrefix + "Invalid password, check that the Bot Password is correct.")
			# 		elif (response["error"] == "invalid-guild-id"): print(storemanBotPrefix + "The Guild ID entered was not found on the Storeman Bot server. Please check that it is correct.")
			# 		else: print(storemanBotPrefix + "An unhandled error occured: " + response["error"])
			# 	except Exception as e:
			# 		print("There was an error connecting to the Bot")
			# 		print("Exception: ", e)
		else:
			pass
	print(items.sortedcontents)

def newstockpopup(image):
	# global stockpilename
	global StockpileNameEntry
	################  HANDLE NEW STOCKPILE NAMES HERE ################

################################# ITEMS BELOW FOR TESTING ##########################################
image = "testimage.png"
SearchImage(image)
