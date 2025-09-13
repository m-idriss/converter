# File to Calendar Converter - Copilot Instructions

**ALWAYS follow these instructions first and fallback to additional search and context gathering only if the information here is incomplete or found to be in error.**

This is an Angular 20+ application that converts images and PDFs into ICS calendar files using OCR (Tesseract.js), PDF processing (PDF.js), and Firebase integration for authentication and optional server-side processing.

## Working Effectively

### Prerequisites and Setup
- Install Node.js 20+ (Functions require Node 22 but work with 20)
- Chrome/Chromium browser for testing
- **NEVER CANCEL any build or test commands** - builds take 8+ seconds, tests take 12+ seconds

### Bootstrap the Repository
```bash
# Install all dependencies - takes ~30 seconds, NEVER CANCEL
npm install

# Install Firebase Functions dependencies (if using Firebase features)
cd functions && npm install
cd ..
```

### Build Process
```bash
# Development build - takes ~8 seconds, NEVER CANCEL. Set timeout to 30+ seconds.
npm run build

# Production build - takes ~8.5 seconds, NEVER CANCEL. Set timeout to 30+ seconds.
npm run build -- --configuration=production

# Build Firebase Functions - takes ~6 seconds, NEVER CANCEL. Set timeout to 20+ seconds.
cd functions && npm run build
```

**Expected Build Warnings (NORMAL):**
- Bundle size exceeds budget (839KB > 500KB limit) - WARNING only, build succeeds
- CommonJS dependencies (file-saver, moment) cause optimization warnings - non-breaking

### Development Server
```bash
# Start development server - takes ~4 seconds to start, runs on localhost:4200
npm start
# OR
ng serve
```
The application will be available at `http://localhost:4200/` with hot reload enabled.

### Testing
```bash
# Run tests with headless Chrome - takes ~12 seconds, NEVER CANCEL. Set timeout to 30+ seconds.
CHROME_BIN=/usr/bin/google-chrome-stable npx ng test --browsers=ChromeHeadless --watch=false

# Run tests in watch mode (interactive development)
npm test
```

**Expected Test Behavior:**
- Some tests fail due to missing HttpClient providers (normal for current test setup)
- Tests build successfully and execute in headless Chrome
- 7 total tests with 2 expected failures related to dependency injection setup

### Validation Steps
Always run these steps after making changes:

1. **Build Validation:**
   ```bash
   npm run build
   ```
   - Should complete in ~8 seconds with warnings (normal)
   - Check `dist/converter-app/` directory is created

2. **Application Functionality:**
   ```bash
   npm start
   ```
   - Navigate to `http://localhost:4200/`
   - Verify clean UI with "File to Calendar Converter" header
   - Check Google Sign-in button is present
   - Verify "Authentication Required" section displays

3. **Test Validation:**
   ```bash
   CHROME_BIN=/usr/bin/google-chrome-stable npx ng test --browsers=ChromeHeadless --watch=false
   ```
   - Should show "5 SUCCESS, 2 FAILED" (expected pattern)

### Code Formatting
```bash
# Format code using Prettier (configured in package.json)
npx prettier --write src/
```

## Project Structure

### Key Directories
```
src/
├── app/
│   ├── components/
│   │   ├── auth/              # Google authentication component
│   │   └── file-upload/       # Drag & drop file upload interface
│   ├── services/
│   │   ├── auth.ts            # Firebase authentication service
│   │   ├── file-processor.ts  # OCR and PDF text extraction
│   │   └── calendar.ts        # ICS calendar file generation
│   ├── app.ts                 # Main standalone app component
│   └── app.config.ts          # Application configuration
├── environments/              # Environment-specific configs
└── styles.scss               # Global SCSS styles

functions/
├── src/index.ts              # Firebase Functions (OpenAI integration)
└── package.json              # Functions dependencies (Node 22)
```

### Key Files to Know
- `package.json` - Main dependencies and npm scripts
- `angular.json` - Angular project configuration
- `firebase.json` - Firebase hosting and functions config
- `src/environments/` - Environment configurations (Firebase keys)

## Technology Stack

### Frontend
- **Angular 20.2.2** with standalone components
- **TypeScript 5.9+** for type safety
- **SCSS** for styling with modern CSS features

### File Processing
- **Tesseract.js 6.0+** for OCR (text extraction from images)
- **PDF.js 5.4+** for PDF text extraction
- **Moment.js 2.30+** for date/time parsing
- **ICS 3.8+** for calendar file generation
- **file-saver 2.0+** for file downloads

### Firebase Integration (Optional)
- **Firebase Auth** with Google provider
- **Firebase Functions** with OpenAI integration
- **Firebase Hosting** for deployment

## Configuration

### Environment Setup
Update `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false, // true for prod
  firebase: {
    apiKey: "your-api-key",
    authDomain: "your-project-id.firebaseapp.com", 
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
  }
};
```

### Firebase Functions Setup (Optional)
If using Firebase Functions for server-side processing:
1. Configure `.env.image-to-ics` in `functions/` directory
2. Set `OPENAI_API_KEY` environment variable
3. Deploy with `cd functions && npm run deploy`

## Common Development Tasks

### Adding New Components
```bash
# Generate new component with SCSS styling
ng generate component components/my-component --style=scss
```

### Working with Services
All services are injectable singletons (`providedIn: 'root'`):
- `AuthService` - Handle Google authentication
- `FileProcessor` - Process uploaded files (images/PDFs) 
- `Calendar` - Parse text and generate ICS files

### Testing Changes
1. **Always start with a clean build:**
   ```bash
   npm run build
   ```

2. **Test in development:**
   ```bash
   npm start
   ```

3. **Validate with tests:**
   ```bash
   CHROME_BIN=/usr/bin/google-chrome-stable npx ng test --browsers=ChromeHeadless --watch=false
   ```

4. **Check production build:**
   ```bash
   npm run build -- --configuration=production
   ```

### File Upload Flow
The application supports:
1. Drag & drop file upload (images: JPG, PNG; PDFs)
2. OCR text extraction using Tesseract.js
3. PDF text extraction using PDF.js  
4. Smart date/time parsing with Moment.js
5. ICS calendar file generation and download

### Known Limitations
- Bundle size exceeds Angular budget (839KB > 500KB) - performance warning only
- CommonJS dependencies cause optimization warnings - doesn't affect functionality
- Tests require manual HttpClient provider setup for full coverage
- Firebase Functions need Node 22+ (but work with Node 20+)

## Debugging Tips

### Build Issues
- Check `angular.json` syntax if build fails
- Verify all dependencies installed with `npm install`
- Clear `dist/` directory and rebuild if needed

### Test Issues  
- Ensure Chrome/Chromium is installed for headless testing
- Use `CHROME_BIN` environment variable to specify Chrome path
- Missing providers in tests are expected with current setup

### Runtime Issues
- Check browser console for Firebase configuration errors
- Verify environment files have correct Firebase keys
- OCR processing is CPU-intensive and may take time for large images

## Deployment

### Firebase Hosting (if configured)
```bash
# Build for production
npm run build -- --configuration=production

# Deploy (requires Firebase CLI)
firebase deploy
```

### Manual Deployment
The `dist/converter-app/` directory contains static files ready for any web server.