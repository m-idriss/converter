# 📅 File to Calendar Converter

An Angular 2025+ application that intelligently converts images and PDFs into ICS calendar files using advanced OCR technology and smart event detection.

## ✨ Features

- **📤 File Upload**: Drag-and-drop interface for images (JPG, PNG) and PDF files
- **🔍 Text Extraction**: Advanced OCR with Tesseract.js and PDF.js processing
- **🧠 Smart Parsing**: Automatic detection of dates, times, and event information
- **📅 ICS Generation**: Creates downloadable calendar files with proper formatting
- **🔐 Firebase Integration**: Google authentication and optional cloud functions
- **📱 Responsive Design**: Mobile-optimized interface with modern UI
- **⚡ Performance**: Fast processing with confidence scoring

## 🗺️ Project Roadmap

For detailed development plans, feature priorities, and future enhancements, see our [**Product Roadmap**](./ROADMAP.md).

**Current Focus Areas:**

- ✅ Bundle size optimization (✅ **ACHIEVED: 326KB < 500KB target**)
- ♿ Accessibility improvements (WCAG 2.1 AA compliance)  
- 📄 Additional file format support (DOCX, TXT, Excel)
- 📲 Direct calendar integration (Google, Outlook, Apple)

### 📊 Performance Status
- **Bundle Size**: 326kB (✅ 35% under 500kB target)
- **First Contentful Paint**: ~164ms (✅ 89% under 1.5s target) 
- **Lazy Loading**: PDF.js (375kB) loads only when needed
- **Tests**: 37/37 passing ✅

## 🚀 Quick Start

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.2.2.

### Prerequisites

- Node.js 20+ and npm
- Chrome/Chromium browser for testing

### Development server

To start a local development server:

```bash
npm install  # Install dependencies (takes ~30 seconds)
npm start    # Start development server
npm run build # Build for production
npm run build:analyze # Analyze bundle size with interactive charts
npm run check:roadmap # Validate roadmap targets are met
npm run validate # Full validation: build + roadmap + tests
```

Once the server is running, navigate to `http://localhost:4200/`. The application will automatically reload when you modify source files.

## 🛠️ Development

### Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component:

```bash
ng generate component component-name --style=scss
```

For a complete list of available schematics (components, services, directives, pipes):

```bash
ng generate --help
```

### Building

Build for development:

```bash
npm run build
```

Build for production:

```bash
npm run build -- --configuration=production
```

Built artifacts are stored in the `dist/` directory with optimizations for performance and speed.

### Testing

Execute unit tests with the [Karma](https://karma-runner.github.io) test runner:

```bash
npm test  # Interactive mode
# OR for CI/headless testing:
CHROME_BIN=/usr/bin/google-chrome-stable npx ng test --browsers=ChromeHeadless --watch=false
```

### End-to-end testing

For end-to-end (e2e) testing:

```bash
ng e2e
```

_Note: Angular CLI does not include an e2e framework by default. Choose one that suits your needs._

## 📚 Documentation & Resources

- 📖 [Development Guide](./DEVELOPMENT.md) - Detailed setup and architecture information
- 🚀 [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- 🗺️ [Product Roadmap](./ROADMAP.md) - Future features and development plans
- 📖 [Angular CLI Reference](https://angular.dev/tools/cli) - Official Angular CLI documentation

## 🤝 Contributing

We welcome contributions! Please see our [roadmap](./ROADMAP.md) for current priorities and development guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
