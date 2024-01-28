# Pseudocode for Python Flask server
import base64
import numpy as np
import re
import json
import tempfile

from flask import Flask, request
from google.oauth2 import service_account
from googleapiclient.discovery import build
from scripts.google_drive import upload_file_json,upload_file_image,create_folder
from scripts.airtable import add_new_scores
from io import BytesIO
from PIL import Image
from flask_cors import CORS,cross_origin
from flask import jsonify

app = Flask(__name__)

CORS(app, resources={
    r"/hook": {"origins": "http://127.0.0.1:5500"},
    r"/upload_json": {"origins": ["http://localhost:5500", "http://127.0.0.1:5501"]},
    r"/name_id": {"origins": ["http://localhost:5500", "http://127.0.0.1:5501"]}
})

general_parent_folder_id = '1CsOxJS3oNIoPNoqvJAIBBmJF4RQtHWMV'
json_folder_id = ''
image_folder_id = ''

@app.route('/name_id', methods=['POST'])
@cross_origin(supports_credentials=True)
def get_name():
    global json_folder_id
    global image_folder_id
    data = request.get_json()
    print("received name data")
    # Extract the 'name' and 'id' from the parsed JSON data
    name = data.get('name')
    random_id = data.get('id')
    print("name",name)
    print("random_id",random_id)
    
    record_data = {
    "records": [
        {
            "fields": {
                "Name": name,
                "ID": random_id,
            }
        }
    ]
}
    
    #add name and id to airtable
    add_new_scores(record_data)
    #What do I do if they double click? - only let them click once and wait for it to load?
    
    #Create a folder in google drive with the random if name
    session_folder_id = create_folder(random_id, parent_folder_id=general_parent_folder_id)
    json_folder_id = create_folder('json_data', parent_folder_id=session_folder_id)
    image_folder_id = create_folder('image_data', parent_folder_id=session_folder_id)
    
    #Maybe add a field folder created yes or no
    return jsonify({'message': 'Data processed successfully'}), 200
    

@app.route('/hook', methods=['POST'])
@cross_origin(supports_credentials=True)
def get_image():
    image_b64 = request.values['imageBase64']
    image_name = request.values['imageName']  # Receive the screenshot file name
    task_name = request.values['taskName']
    completed_episodes = request.values['completedEpisodes']
    image_data = base64.b64decode(re.sub('^data:image/.+;base64,', '', image_b64))
    image_PIL = Image.open(BytesIO(image_data))
    image_np = np.array(image_PIL)
    print('Image received: {}'.format(image_np.shape))
    print('Image name',image_name)
    
     # Save the image to a temporary file in the same directory
    image_PIL.save(image_name + ".png", format='PNG')
    
        # Authenticate with Google Drive API
    SCOPES = ['https://www.googleapis.com/auth/drive']
    SERVICE_ACCOUNT_FILE = "/Users/encord/Desktop/private/genieai-412117-bf129d3132c9.json"

    # Create credentials using the service account file
    credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)

    # Build the Google Drive service
    drive_service = build('drive', 'v3', credentials=credentials)

    image_file_name = f"{task_name}_{completed_episodes}_{image_name}"
    print("image_folder_id",image_folder_id)
    uploaded_file_id = upload_file_image(image_file_name, f'/Users/encord/Documents/Code/Genie/demo_collection_website/{image_name}.png', parent_folder_id=image_folder_id)
    print("uploaded file")
    return {"status": "success", "file_id": uploaded_file_id}, 200

@app.route('/upload_json', methods=['POST'])
@cross_origin(supports_credentials=True)
def upload_json():
    data = request.get_json()
    json_content = json.dumps(data)
    print("json_content",json_content)
    
    # Extract task name and completed episodes from the request data
    task_name = data.get('taskName')
    print("task_name",task_name)
    completed_episodes = data.get('completedEpisodes')
    print("completed_episodes",completed_episodes)
    
    json_data = data.get('jsonData')
    # print("json_data", json_data)

    # Save JSON data to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as temp_file:
        temp_file.write(json_data.encode('utf-8'))
        temp_file_path = temp_file.name

    print("temp file path",temp_file_path)
    print("json_folder_id",json_folder_id)
    
    json_file_name = f"{task_name}_{completed_episodes}"
    # Upload to Google Drive
    uploaded_file_id = upload_file_json(json_file_name, temp_file_path, parent_folder_id=json_folder_id)
    print(f'Uploaded file ID: {uploaded_file_id}')
    print("uploaded json")

    return {"status": "success", "file_id": uploaded_file_id}, 200


if __name__ == '__main__':
    app.run(debug=True)



