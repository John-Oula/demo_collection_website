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

app = Flask(__name__)
# CORS(app, support_credentials=True)
# CORS(app, resources={r"/hook": {"origins": "http://localhost:8000"}})
CORS(app, resources={r"/hook": {"origins": "http://127.0.0.1:5500"}})


@app.route('/hook', methods=['POST'])
@cross_origin(supports_credentials=True)
def get_image():
    image_b64 = request.values['imageBase64']
    image_data = base64.b64decode(re.sub('^data:image/.+;base64,', '', image_b64))
    image_PIL = Image.open(BytesIO(image_data))
    image_np = np.array(image_PIL)
    print('Image received: {}'.format(image_np.shape))
    
     # Save the image to a temporary file in the same directory
    temp_file_path = "temp_image.png"  # Temporary file name
    image_PIL.save(temp_file_path, format='PNG')
    
        # Authenticate with Google Drive API
    SCOPES = ['https://www.googleapis.com/auth/drive']
    SERVICE_ACCOUNT_FILE = "/Users/encord/Desktop/private/genieai-412117-bf129d3132c9.json"

    # Create credentials using the service account file
    credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)

    # Build the Google Drive service
    drive_service = build('drive', 'v3', credentials=credentials)

    upload_file_image("temp_image", '/Users/encord/Documents/Code/Genie/demo_collection_website/temp_image.png', parent_folder_id='1BzniPTgy_KDy36sS_hufqBEI3YCEvYPq')
    print("uploaded file")
    return ''

if __name__ == '__main__':
    app.run(debug=True)



