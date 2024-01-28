import os
from dotenv import load_dotenv
import requests
import json

#Load the .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '../.env')
load_dotenv(dotenv_path=dotenv_path)
print("dotenv path",dotenv_path)

AIRTABLE_TOKEN = os.getenv("AIRTABLE_TOKEN")
AIRTABLE_BASE_ID = os.getenv("AIRTABLE_BASE_ID")
AIRTABLE_URL = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}"

def add_new_scores(scores):
    """Add scores to the Airtable."""
    url = f"{AIRTABLE_URL}/demo_interacters_data"
    headers = {
      'Authorization': f'Bearer {AIRTABLE_TOKEN}',
      'Content-Type': 'application/json'
    }
    print("about to send record")
    response = requests.request("POST", url, headers=headers, data=json.dumps(scores))
    print("sent record")
    return response