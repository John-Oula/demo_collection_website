# Pseudocode for Python Flask server
from flask import Flask, request
from google.oauth2 import service_account
from googleapiclient.discovery import build
from scripts.google_drive import upload_file_json,upload_file_image
import base64
from io import BytesIO
import numpy as np
import re
from PIL import Image
from flask_cors import CORS,cross_origin
import json
import tempfile

app = Flask(__name__)
# CORS(app, support_credentials=True)
# CORS(app, resources={r"/hook": {"origins": "http://localhost:8000"}})
# CORS(app, resources={r"/hook": {"origins": "http://127.0.0.1:5500"}})
CORS(app, resources={
    r"/hook": {"origins": "http://127.0.0.1:5500"},
    r"/upload_json": {"origins": "http://127.0.0.1:5500"}
})

@app.route('/hook', methods=['POST'])
@cross_origin(supports_credentials=True)
def get_image():
    image_b64 = request.values['imageBase64']
    image_name = request.values['imageName']  # Receive the screenshot file name
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

    upload_file_image(image_name, f'/Users/encord/Documents/Code/Genie/demo_collection_website/{image_name}.png', parent_folder_id='1BzniPTgy_KDy36sS_hufqBEI3YCEvYPq')
    print("uploaded file")
    return ''

@app.route('/upload_json', methods=['POST'])
@cross_origin(supports_credentials=True)
def upload_json():
    data = request.get_json()
    json_content = json.dumps(data)

    # Save JSON data to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as temp_file:
        temp_file.write(json_content.encode('utf-8'))
        temp_file_path = temp_file.name

    print("temp file path",temp_file_path)
    # Upload to Google Drive
    uploaded_file_id = upload_file_json('json_data_two', temp_file_path, parent_folder_id='1BzniPTgy_KDy36sS_hufqBEI3YCEvYPq')
    print(f'Uploaded file ID: {uploaded_file_id}')
    print("uploaded json")

    return {"status": "success", "file_id": uploaded_file_id}, 200


if __name__ == '__main__':
    app.run(debug=True)



