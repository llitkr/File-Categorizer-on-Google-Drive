# File Categorizer on Google Drive
This app will help you to categorize files in folder on Google Drive.

Make a Google Spread Sheet file in the folder where you want to categorize files.
You should write the name of Spread Sheet "FileCategorizerConfig" in default setting(You can change it on "variables.gs" but also should consider there should not be other file that has same name with configure file.

And write categorizing rules. First row is for index. write from second rows.

first column is for search keyword,
second one is for target folder ID.
The last column is for notes.

You can only write keyword column so app will make folder automatically in same folder and add the folder ID on Spread Sheet instead of you.

Don't forget to run the script with V8 engine.(You can find on "Run" menu)

When you use the option "moveEtc" true, must write the option "etcName".

I'm still coding this app. Please tell me if there is an error.
