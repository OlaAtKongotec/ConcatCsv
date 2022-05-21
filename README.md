# Concat CSV
### Concatinate all csv files in a folder into one file. With the same or different columns / column order.

Sometimes you need to do something, that at first glance looks super easy. But when proves itself difficult and hard to google. This was the case trying to append / concatinate several hundreds of csv files, I had in the same folder, into one file. Simple solutions like cat terminal command did not work, as the column count and order differed.

Heres my solution, if you ever find yourself in my situation. You need to have Node Js installed. Then download the program, and cd the program folder in terminal and write:

node concat-csv.js in=/folder/with/csv/to/merge/ out=/where/to/output/ delimiter=,

Where delimiter is a single character, like , (comma) or any other character that your csv files use for delimiting.