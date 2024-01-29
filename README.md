# demo_collection_website
this is where we will host the demo website for people to use and get recorded

Step 1:
Store the .env file in the top level of your folder

Step 2
The main files to go through for front end are:
html_files/core/Core.js
html_files/core/Record.js
index.html

The main files to go through for the back end are:
scripts/airtable.py
scripts/google_drive.py
scripts/server.py

#Set up a virtual environment
python -m venv env
source env/bin/activate
pip insttal -r requirements

#Running this code locally
Front End:
Install html2canvas: -this is what we are currently using to store screenshots
`npm install html2canvas`

Make sure html2canvas is correctly referenced in the .html files listed in the top of core.js in variable var htmlFiles.

Use the open with live server extension on visual studio code to run and open index.html otherwise you will run into CORS issues

Backend:
Run `python scripts/server.py`

