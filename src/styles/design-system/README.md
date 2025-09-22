# 🎨 File to Calendar Converter - Design System

## Overview

This is a comprehensive Apple-inspired design system that provides a unified visual language across the File to Calendar Converter application. The system is built with modular SCSS architecture and provides consistent design tokens, components, and utilities.

## 🏗️ Architecture

```
src/styles/design-system/
├── tokens/
│   ├── _variables.scss      # Core design tokens (colors, spacing, shadows, etc.)
│   └── _typography.scss     # Font system and text utilities
├── utilities/
│   ├── _animations.scss     # Keyframes and animation utilities
│   ├── _effects.scss        # Visual effects (glass morphism, glows)
│   └── _responsive.scss     # Breakpoints and responsive utilities
├── components/
│   ├── _buttons.scss        # Unified button system
│   └── _status-messages.scss # Status message components
├── _index.scss              # Main import file
└── README.md               # This documentation
```

## 🎯 Design Tokens

### Colors

Our color system is based on Apple's design language with 10-shade palettes:

```scss
// Primary (Apple Blue)
--primary-50 to --primary-900

// Secondary (Apple Pink)  
--secondary-50 to --secondary-900

// Semantic Colors
--success-50 to --success-900  (Apple Green)
--error-50 to --error-900      (Apple Red)
--warning-50 to --warning-900  (Apple Orange)
--info-50 to --info-900        (Apple Light Blue)

// Neutral Colors
--gray-50 to --gray-900
```

### Typography

```scss
// Font Sizes
--text-xs (12px) to --text-6xl (60px)

// Font Weights
--font-light (300) to --font-extrabold (800)

// Line Heights
--leading-none (1) to --leading-loose (2)
```

### Spacing

```scss
// Spacing Scale (33 tokens)
--space-0 (0) to --space-32 (128px)
```

### Breakpoints

```scss
--breakpoint-mobile: 480px
--breakpoint-tablet: 768px  
--breakpoint-desktop: 1024px
--breakpoint-wide: 1280px
```

## 🧩 Components

### Buttons

The design system provides a comprehensive button system:

**Variants:**
- `.btn-primary` - Main action buttons
- `.btn-secondary` - Secondary actions
- `.btn-success` - Success/confirmation actions
- `.btn-danger` - Destructive actions
- `.btn-warning` - Warning actions
- `.btn-info` - Informational actions
- `.btn-ghost` - Subtle actions
- `.btn-link` - Link-style buttons

**Sizes:**
- `.btn-xs` - Extra small
- `.btn-sm` - Small
- `.btn` - Default
- `.btn-lg` - Large
- `.btn-xl` - Extra large

**Modifiers:**
- `.btn-full` - Full width
- `.btn-icon` - Icon-only buttons
- `.btn-rounded` - Fully rounded
- `.btn-loading` - Loading state

**Example:**
```html
<button class="btn btn-primary btn-lg">
  Primary Action
</button>
```

### Status Messages

Consistent status message system:

**Variants:**
- `.status-success` - Success messages
- `.status-error` - Error messages
- `.status-warning` - Warning messages
- `.status-info` - Informational messages
- `.status-neutral` - Neutral messages

**Sizes:**
- `.status-sm` - Compact
- `.status-message` - Default
- `.status-lg` - Large

**Layouts:**
- `.status-compact` - Icon and title only
- `.status-banner` - Full-width banner
- `.status-toast` - Positioned notifications

**Example:**
```html
<div class="status-message status-success">
  <div class="status-icon">✅</div>
  <div class="status-content">
    <div class="status-title">Success!</div>
    <div class="status-description">Your file was processed successfully.</div>
  </div>
</div>
```

## 🎭 Visual Effects

### Glass Morphism

```scss
.glass-effect        // Base glass effect
.glass-card         // Enhanced card glass effect
.glass-modal        // Strong glass for overlays
.glass-subtle       // Subtle background glass
.glass-dark         // Dark glass variant
```

### Glow Effects

```scss
.interactive-glow   // Apple-style interactive glow
.glow-primary      // Primary color glow
.glow-success      // Success color glow
.glow-error        // Error color glow
.glow-warning      // Warning color glow
```

### Shine Effects

```scss
.button-shine      // Button shine animation
.card-shine        // Card shine effect
```

## 🏃‍♂️ Animations

### Keyframe Animations

- `slideIn`, `slideInFromRight`, `slideInFromLeft`
- `fadeIn`, `fadeOut`, `scaleIn`
- `float`, `pulse`, `heartbeat`
- `spin`, `bounce`, `shake`, `wiggle`
- `dragPulse` (for drag & drop)
- `shimmer`, `glow`

### Animation Utilities

```scss
.animate-slide-in
.animate-fade-in
.animate-pulse
.animate-spin
.animate-bounce
// ... and more
```

### Transition Utilities

```scss
.transition-all
.transition-colors
.transition-opacity
.transition-shadow
.transition-transform
```

### Hover Effects

```scss
.hover-lift        // Subtle lift on hover
.hover-scale       // Scale on hover
.hover-rotate      // Rotate on hover
```

## 📱 Responsive Design

### Breakpoint Mixins

```scss
@include mobile-only { /* styles */ }
@include tablet-up { /* styles */ }
@include desktop-up { /* styles */ }
```

### Responsive Utilities

```scss
// Display
.hidden-mobile, .hidden-tablet, .hidden-desktop
.show-mobile, .show-tablet, .show-desktop

// Layout
.flex-col-mobile, .flex-row-desktop
.grid-cols-mobile-1, .grid-cols-desktop-3

// Text
.text-center-mobile, .text-left-desktop
```

## 🛠️ Utility Classes

### Spacing

```scss
// Margin
.m-0, .m-1, .m-2, ... .m-12
.mt-0, .mt-1, ... (top)
.mb-0, .mb-1, ... (bottom)
.ml-0, .ml-1, ... (left)  
.mr-0, .mr-1, ... (right)

// Padding
.p-0, .p-1, .p-2, ... .p-12
.pt-0, .pt-1, ... (top)
.pb-0, .pb-1, ... (bottom)
.pl-0, .pl-1, ... (left)
.pr-0, .pr-1, ... (right)
```

### Typography

```scss
// Font Sizes
.text-xs, .text-sm, .text-base, .text-lg, .text-xl, etc.

// Font Weights  
.font-light, .font-normal, .font-medium, .font-semibold, .font-bold

// Colors
.text-primary, .text-secondary, .text-success, .text-error
.text-gray-50, .text-gray-100, ... .text-gray-900

// Alignment
.text-left, .text-center, .text-right, .text-justify

// Transform
.uppercase, .lowercase, .capitalize
```

### Layout

```scss
// Display
.block, .inline-block, .flex, .grid, .hidden

// Position
.relative, .absolute, .fixed, .sticky

// Flexbox
.justify-center, .justify-between, .items-center, .items-start

// Grid
.grid-cols-1, .grid-cols-2, .grid-cols-3
.gap-0, .gap-1, .gap-2, .gap-3
```

### Visual

```scss
// Border Radius
.rounded-none, .rounded-sm, .rounded-base, .rounded-lg, .rounded-full

// Opacity
.opacity-0, .opacity-25, .opacity-50, .opacity-75, .opacity-100

// Shadows
.shadow-xs, .shadow-sm, .shadow-base, .shadow-md, .shadow-lg
.shadow-glass, .shadow-glass-hover

// Z-Index
.z-dropdown, .z-modal, .z-popover, .z-tooltip, .z-toast
```

## 🎯 Usage Guidelines

### Getting Started

1. Import the design system in your main styles:
```scss
@import 'styles/design-system/index';
```

2. Use design tokens in your components:
```scss
.my-component {
  padding: var(--space-4);
  background: var(--primary-500);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
}
```

3. Apply utility classes in templates:
```html
<div class="p-4 bg-white rounded-lg shadow-md">
  <h2 class="text-xl font-semibold text-gray-900 mb-3">
    Component Title
  </h2>
  <button class="btn btn-primary">
    Action
  </button>
</div>
```

### Best Practices

1. **Use Design Tokens**: Always prefer CSS custom properties over hardcoded values
2. **Utility-First**: Use utility classes for spacing, colors, and layout
3. **Component Classes**: Use component classes for complex UI patterns
4. **Responsive Design**: Mobile-first approach with progressive enhancement
5. **Accessibility**: Maintain proper contrast ratios and focus states
6. **Performance**: Leverage the optimized class structure for minimal CSS

### Migration from Legacy Styles

The design system maintains backward compatibility while providing new utilities:

1. **Replace hardcoded values** with design tokens
2. **Consolidate similar styles** using utility classes  
3. **Update component styles** to use the new button/status systems
4. **Enhance responsive behavior** with new breakpoint utilities

## 🔧 Customization

### Extending Colors

Add new color variants in `_variables.scss`:

```scss
:root {
  --brand-50: #f0f9ff;
  --brand-500: #0ea5e9;
  --brand-900: #0c4a6e;
}
```

### Adding Components

Create new component files in `components/`:

```scss
// components/_cards.scss
.card {
  @extend .glass-card;
  // Custom card styles
}

.card-header {
  // Header styles
}
```

### Custom Animations

Add keyframes in `utilities/_animations.scss`:

```scss
@keyframes customAnimation {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-custom {
  animation: customAnimation var(--transition-base) ease-out;
}
```

## 📊 Performance

The design system is optimized for performance:

- **Modular Architecture**: Import only what you need
- **CSS Custom Properties**: Efficient runtime theming
- **Utility Classes**: Minimal CSS output through reuse
- **Reduced Specificity**: Flat class hierarchy for better caching

**Bundle Impact:**
- Base system: ~44kB (compressed ~7.5kB)
- Individual modules can be imported separately
- Utility classes eliminate duplicate styles

## 🎨 Design Philosophy

This design system follows Apple's Human Interface Guidelines:

1. **Clarity**: Clear visual hierarchy and readable typography
2. **Deference**: Content is king, interface supports content
3. **Depth**: Realistic lighting and layering through glassmorphism
4. **Consistency**: Unified patterns and behaviors
5. **Accessibility**: Inclusive design for all users

---

For questions or contributions, please refer to the main project documentation.