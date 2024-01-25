import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# Define the Google Drive API scopes and service account file path
SCOPES = ['https://www.googleapis.com/auth/drive']
SERVICE_ACCOUNT_FILE = "/Users/encord/Desktop/private/genieai-412117-bf129d3132c9.json"

# Create credentials using the service account file
credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)

# Build the Google Drive service
drive_service = build('drive', 'v3', credentials=credentials)

def create_folder(folder_name, parent_folder_id=None):
    """Create a folder in Google Drive and return its ID."""
    folder_metadata = {
        'name': folder_name,
        "mimeType": "application/vnd.google-apps.folder",
        'parents': [parent_folder_id] if parent_folder_id else []
    }

    created_folder = drive_service.files().create(
        body=folder_metadata,
        fields='id'
    ).execute()

    print(f'Created Folder ID: {created_folder["id"]}')
    return created_folder["id"]

def list_folder(parent_folder_id=None, delete=False):
    """List folders and files in Google Drive."""
    results = drive_service.files().list(
        q=f"'{parent_folder_id}' in parents and trashed=false" if parent_folder_id else None,
        pageSize=1000,
        fields="nextPageToken, files(id, name, mimeType)"
    ).execute()
    items = results.get('files', [])

    if not items:
        print("No folders or files found in Google Drive.")
    else:
        print("Folders and files in Google Drive:")
        for item in items:
            print(f"Name: {item['name']}, ID: {item['id']}, Type: {item['mimeType']}")
            if delete:
                delete_files(item['id'])
                
def delete_files(file_or_folder_id):
    """Delete a file or folder in Google Drive by ID."""
    try:
        drive_service.files().delete(fileId=file_or_folder_id).execute()
        print(f"Successfully deleted file/folder with ID: {file_or_folder_id}")
    except Exception as e:
        print(f"Error deleting file/folder with ID: {file_or_folder_id}")
        print(f"Error details: {str(e)}")
        
        
def upload_file_json(file_name, file_path, parent_folder_id=None):
    """Upload a file to Google Drive."""
    file_metadata = {
        'name': file_name,
        'parents': [parent_folder_id] if parent_folder_id else []
    }
    media = MediaFileUpload(file_path, mimetype='application/json')

    uploaded_file = drive_service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id'
    ).execute()

    print(f'Uploaded File ID: {uploaded_file["id"]}')
    return uploaded_file["id"]

def upload_file_image(file_name, file_path, parent_folder_id=None):
    """Upload a file to Google Drive."""
    file_metadata = {
        'name': file_name,
        'parents': [parent_folder_id] if parent_folder_id else []
    }
    media = MediaFileUpload(file_path, mimetype='image/png')

    uploaded_file = drive_service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id'
    ).execute()

    print(f'Uploaded File ID: {uploaded_file["id"]}')
    return uploaded_file["id"]


if __name__ == '__main__':
    # Example usage:
    list_folder()
    # Create a new folder
    # create_folder("test_api")
    # create_folder("test_two", parent_folder_id='1BzniPTgy_KDy36sS_hufqBEI3YCEvYPq')
    # list_folder()
    # upload_file('upload_json', '/Users/encord/Downloads/upload_json.json', parent_folder_id='1BzniPTgy_KDy36sS_hufqBEI3YCEvYPq')