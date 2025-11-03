# File Upload API Documentation

## Overview
The file upload API allows users to upload images and videos for posts. The API supports both single and multiple file uploads with proper validation and constraints.

## Endpoint
```
POST /api/v1/posts/upload
```

## Authentication
- **Required**: Yes
- **Method**: Bearer Token in Authorization header or HTTP-only cookies

## Request Format
- **Content-Type**: `multipart/form-data`
- **Field Name**: `media`
- **Max Files**: 4 (1 video + 3 images maximum)

## File Constraints
- **Images**: Maximum 3 images per upload
- **Videos**: Maximum 1 video per upload
- **File Size**: Maximum 50MB per file
- **Supported Formats**:
  - Images: `image/*` (jpg, jpeg, png, gif, webp, etc.)
  - Videos: `video/*` (mp4, avi, mov, webm, etc.)

## Request Example

### Single Image Upload
```bash
curl -X POST http://localhost:5000/api/v1/posts/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "media=@image1.jpg"
```

### Multiple Files Upload
```bash
curl -X POST http://localhost:5000/api/v1/posts/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "media=@image1.jpg" \
  -F "media=@image2.jpg" \
  -F "media=@video1.mp4"
```

### JavaScript/Frontend Example
```javascript
const formData = new FormData();
formData.append('media', fileInput.files[0]);

fetch('/api/v1/posts/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Upload successful:', data);
  // Use data.data.urls for post creation
});
```

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": {
    "files": [
      {
        "url": "http://localhost:5000/uploads/images/media-1234567890-123456789.jpg",
        "type": "image",
        "filename": "media-1234567890-123456789.jpg"
      },
      {
        "url": "http://localhost:5000/uploads/videos/media-1234567890-123456789.mp4",
        "type": "video",
        "filename": "media-1234567890-123456789.mp4"
      }
    ],
    "urls": [
      "http://localhost:5000/uploads/images/media-1234567890-123456789.jpg",
      "http://localhost:5000/uploads/videos/media-1234567890-123456789.mp4"
    ],
    "types": ["image", "video"]
  }
}
```

### Error Responses

#### No Files Uploaded (400)
```json
{
  "success": false,
  "message": "No files uploaded"
}
```

#### Invalid File Type (400)
```json
{
  "success": false,
  "message": "Only images and videos are allowed"
}
```

#### Too Many Videos (400)
```json
{
  "success": false,
  "message": "Maximum 1 video allowed per upload"
}
```

#### Too Many Images (400)
```json
{
  "success": false,
  "message": "Maximum 3 images allowed per upload"
}
```

#### Authentication Required (401)
```json
{
  "success": false,
  "message": "Access token is required"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error during file upload"
}
```

## File Storage
- **Images**: Stored in `uploads/images/` directory
- **Videos**: Stored in `uploads/videos/` directory
- **Naming**: `media-{timestamp}-{random}.{extension}`
- **Access**: Files are accessible via `http://localhost:5000/uploads/{type}/{filename}`

## Usage in Post Creation
After uploading files, use the returned URLs in the post creation API:

```json
{
  "content": "Check out this amazing sunset!",
  "media": [
    "http://localhost:5000/uploads/images/media-1234567890-123456789.jpg",
    "http://localhost:5000/uploads/videos/media-1234567890-123456789.mp4"
  ],
  "mediaType": ["image", "video"]
}
```

## Environment Variables
Make sure to set the following environment variable:
```bash
BASE_URL=http://localhost:5000  # Your server URL
```

## Security Features
- File type validation (only images and videos)
- File size limits (50MB per file)
- Authentication required
- Unique filename generation to prevent conflicts
- Organized storage structure

## Error Handling
The API includes comprehensive error handling for:
- Missing files
- Invalid file types
- File size limits
- Upload constraints (max videos/images)
- Authentication failures
- Server errors

## Implementation Details

### Multer Configuration
- **Storage**: Disk storage with organized directories
- **File Filter**: Only allows image/* and video/* MIME types
- **Size Limit**: 50MB per file
- **Max Files**: 4 files per request

### File Processing
- **Type Detection**: Based on MIME type
- **URL Generation**: Uses BASE_URL environment variable
- **Path Normalization**: Cross-platform compatible file paths
- **Validation**: Enforces post media constraints

### Static File Serving
- **Route**: `/uploads/*`
- **Directory**: `uploads/` folder
- **Access**: Direct URL access to uploaded files

## Notes
- Files are stored permanently on the server
- Consider implementing file cleanup for unused uploads
- For production, consider using cloud storage (AWS S3, Cloudinary, etc.)
- The API returns full URLs that can be directly used in post content
- All uploaded files are accessible via HTTP GET requests

## Testing
The API has been tested with:
- ✅ Single file uploads
- ✅ Multiple file uploads
- ✅ File type validation
- ✅ Size limit validation
- ✅ Authentication requirements
- ✅ Error handling
- ✅ Static file serving
