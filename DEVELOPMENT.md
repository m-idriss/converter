# Converter App - Development Guide

## Overview
This is an Angular 2025+ application that converts images and PDFs into ICS calendar files using Firebase Google authentication and Firebase Functions.

## Features
- **Modern UI**: Built with Angular 20+ and custom SCSS styling
- **File Upload**: Drag-and-drop interface for images and PDFs
- **Text Extraction**: Uses Tesseract.js for OCR and PDF.js for PDF text extraction
- **Smart Parsing**: Automatically detects dates, times, and event information
- **ICS Generation**: Creates downloadable .ics calendar files
- **Firebase Auth**: Google authentication integration
- **Firebase Functions**: Server-side processing capabilities

## Technology Stack
- **Frontend**: Angular 20.2.2, TypeScript, SCSS
- **Authentication**: Firebase Auth with Google provider
- **File Processing**: Tesseract.js, PDF.js
- **Calendar**: Custom ICS generation with moment.js
- **Backend**: Firebase Functions (optional server-side processing)

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm 10+
- Firebase project (optional)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase (optional):
   - Update `src/environments/environment.ts` with your Firebase config
   - Update `.firebaserc` with your project ID

### Development
```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

### Firebase Functions (Optional)
```bash
# Install function dependencies
cd functions && npm install

# Deploy functions
npm run deploy
```

## Project Structure
```
src/
├── app/
│   ├── components/
│   │   ├── auth/           # Authentication component
│   │   └── file-upload/    # File upload component
│   ├── services/
│   │   ├── auth.ts         # Firebase authentication
│   │   ├── file-processor.ts # Image/PDF processing
│   │   └── calendar.ts     # ICS generation
│   └── app.ts              # Main app component
├── environments/           # Environment configurations
└── styles.scss            # Global styles
```

## Usage
1. Open the application in a web browser
2. Sign in with Google (if Firebase is configured)
3. Upload an image or PDF file
4. Review extracted text and parsed events
5. Download the generated ICS calendar file

## Configuration

### Firebase Setup
To enable Firebase features:
1. Create a Firebase project
2. Enable Authentication with Google provider
3. Update environment files with your Firebase config
4. Deploy Firebase Functions (optional)

### Environment Variables
Update `src/environments/environment.ts`:
```typescript
export const environment = {
  firebase: {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    // ... other config
  }
};
```

## Testing
The application includes comprehensive tests:
- Component tests for all UI components
- Service tests for business logic
- Integration tests for the complete workflow

Run tests with:
```bash
npm test
```

## Deployment
Build for production:
```bash
npm run build
```

Deploy to Firebase Hosting (if configured):
```bash
firebase deploy
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request