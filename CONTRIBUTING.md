# 🤝 Contributing to File to Calendar Converter

Thank you for your interest in contributing! This guide will help you get started with contributing to our Angular 20+ file-to-calendar conversion application.

## 🗺️ Before You Start

Check our [**Product Roadmap**](./ROADMAP.md) to understand our development priorities and see where your contribution might fit:

- **P1 (High Priority)**: Critical for user experience and performance
- **P2 (Medium Priority)**: Important for feature completeness and scalability  
- **P3 (Low Priority)**: Nice-to-have improvements and future innovations

## 📋 How to Report Issues

We have specific issue templates to help categorize and prioritize your reports:

### 🐛 **Bug Reports**
Use our [Bug Report template](../../issues/new?template=bug-report.yml) for application bugs, including:
- File upload/processing issues
- OCR/PDF extraction problems  
- Calendar generation bugs
- UI/UX issues

### 🚀 **Feature Requests**
Use our [Feature Request template](../../issues/new?template=feature-request.yml) for new features:
- Check roadmap alignment (Phase 1-4)
- Specify priority level (P1-P3)
- Include user impact assessment

### ⚡ **Performance Issues** 
Use our [Performance Issue template](../../issues/new?template=performance-issue.yml) for:
- Bundle size optimization (P1 priority)
- Loading performance problems
- Core Web Vitals improvements

### ♿ **Accessibility Issues**
Use our [Accessibility Issue template](../../issues/new?template=accessibility-issue.yml) for:
- WCAG 2.1 AA compliance issues
- Screen reader compatibility
- Keyboard navigation problems

### 🗺️ **Roadmap Tasks**
Use our [Roadmap Task template](../../issues/new?template=roadmap-task.yml) for implementing specific roadmap items.

### 💬 **Quick Issues**
Use our [Quick Issue template](../../issues/new?template=quick-issue.yml) for questions, documentation issues, or general feedback.

## 🚀 Development Setup

### Prerequisites
- Node.js 20+ and npm
- Chrome/Chromium browser for testing
- Git for version control

### Getting Started
```bash
# Clone and setup
git clone https://github.com/m-idriss/converter.git
cd converter
npm install  # Takes ~30 seconds

# Development
npm start    # Start dev server at localhost:4200
npm run build  # Build for production (takes ~8 seconds)
npm test     # Run tests with headless Chrome
```

### Key Commands
```bash
# Development workflow
npm start                    # Dev server with hot reload
npm run build               # Production build  
npm test                    # Run tests (headless Chrome)
npm run build -- --configuration=production  # Production build

# Firebase Functions (optional)
cd functions && npm install && npm run build
```

## 📝 Code Style & Quality

### Formatting
- We use **Prettier** for code formatting: `npx prettier --write src/`
- Follow existing code patterns in the Angular 20+ codebase
- Use TypeScript for all new code

### Testing
- Maintain test coverage >90%
- Add tests for new features and bug fixes
- Run `npm test` before submitting PRs

### Performance Guidelines
- **Bundle size target**: <500KB (currently 847KB - help us optimize!)  
- **Loading performance**: First Contentful Paint <1.5s
- Consider lazy loading for large dependencies

## 🔀 Pull Request Process

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Check roadmap alignment** - does this fit our priorities?
4. **Make your changes**:
   - Follow existing code patterns
   - Add appropriate tests
   - Update documentation if needed
5. **Test thoroughly**:
   ```bash
   npm run build  # Verify build works
   npm test      # Verify tests pass
   ```
6. **Commit changes** (`git commit -m 'Add amazing feature'`)
7. **Push to branch** (`git push origin feature/amazing-feature`)
8. **Open Pull Request** with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots for UI changes
   - Performance impact assessment

## 🎯 Priority Areas for Contribution

Based on our roadmap, we especially welcome contributions in:

### 🚀 **Phase 1: Core Improvements (P1 - High Priority)**
- **Bundle size optimization** (Critical - currently 847KB → target <500KB)
- **Accessibility improvements** (WCAG 2.1 AA compliance)
- **Performance optimization** (Web Vitals, loading speed)
- **Optional authentication mode** (allow anonymous usage)

### 🎨 **Phase 2: Feature Expansion (P1-P2)**  
- **Additional file formats** (DOCX, TXT, Excel, PowerPoint)
- **Direct calendar integration** (Google, Outlook, Apple Calendar)
- **Enhanced OCR accuracy** and event detection

### 🔄 **Phase 3 & 4: Advanced Features**
- **Mobile PWA enhancements**
- **Collaboration features**
- **Enterprise integrations**

## 📚 Resources

- 📖 [README.md](./README.md) - Project overview and quick start
- 🗺️ [ROADMAP.md](./ROADMAP.md) - Development roadmap and priorities  
- 🚀 [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- 🔒 [SECURITY.md](./SECURITY.md) - Security policy and reporting

## 🤔 Questions?

- 💬 [Start a Discussion](../../discussions) for questions and ideas
- 📋 [Check existing issues](../../issues) before creating new ones  
- 📖 [Read our documentation](./README.md) for setup help

## 📄 License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

**Thank you for helping make File to Calendar Converter better! 🎉**