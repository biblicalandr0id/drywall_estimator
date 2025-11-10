# 🎨 UI Enhancements Guide

## Overview

This guide documents the comprehensive UI enhancements added to the Drywall Estimator application, including a modern design system, dark mode, animations, accessibility features, and more.

---

## Table of Contents

1. [Design System](#design-system)
2. [Theme Management](#theme-management)
3. [Toast Notifications](#toast-notifications)
4. [Data Visualization](#data-visualization)
5. [Animations](#animations)
6. [Accessibility](#accessibility)
7. [Components](#components)
8. [Responsive Design](#responsive-design)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [API Reference](#api-reference)

---

## Design System

### CSS Variables

The design system uses CSS custom properties for consistent theming:

```css
/* Primary Colors */
--color-primary-600: #0078d4;
--color-accent: #50e3c2;
--color-success: #107c10;
--color-danger: #d13438;
--color-warning: #ff8c00;
--color-info: #00bcf2;

/* Spacing */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
/* ... up to --space-24 */

/* Typography */
--font-size-xs: 11px;
--font-size-sm: 12px;
--font-size-base: 13px;
/* ... up to --font-size-4xl */

/* Shadows */
--shadow-sm: 0 2px 4px 0 rgba(0, 0, 0, 0.08);
--shadow-md: 0 4px 8px 0 rgba(0, 0, 0, 0.12);
--shadow-lg: 0 8px 16px 0 rgba(0, 0, 0, 0.16);
/* ... up to --shadow-2xl */

/* Transitions */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Color Palette

**Light Mode:**
- Background: White (#ffffff)
- Text: Dark gray (#171717)
- Primary: Blue (#0078d4)
- Accent: Teal (#50e3c2)

**Dark Mode:**
- Background: Dark (#1a1a1a)
- Text: Light gray (#f5f5f5)
- Primary: Brighter blue (#4da3ff)
- Accent: Brighter teal (#50e3c2)

---

## Theme Management

### ThemeManager Class

Automatically manages light/dark theme with system preference detection.

```typescript
import { theme } from './ui-enhancements';

// Toggle theme
theme.toggle();

// Set specific theme
theme.set('dark');
theme.set('light');

// Get current theme
const currentTheme = theme.get(); // 'light' | 'dark'

// Check if dark mode
if (theme.isDark()) {
    // Do something for dark mode
}

// Listen for theme changes
window.addEventListener('themechange', (e: CustomEvent) => {
    console.log(`Theme changed to: ${e.detail.theme}`);
});
```

### HTML Implementation

The theme toggle button is automatically added to the header:

```html
<button id="theme-toggle-btn" class="icon-btn" title="Toggle Dark Mode">
    ☀️ <!-- or 🌙 for dark mode -->
</button>
```

---

## Toast Notifications

### ToastManager Class

Show beautiful, dismissible notifications.

```typescript
import { toast } from './ui-enhancements';

// Simple notifications
toast.info('This is an info message');
toast.success('Operation completed successfully!');
toast.warning('Please review this warning');
toast.error('An error occurred');

// With title
toast.success('Your project has been saved', 'Success');

// With custom duration (default: 5000ms)
toast.info('This will stay for 10 seconds', undefined, {
    duration: 10000
});

// With action button
toast.show({
    message: 'File uploaded successfully',
    title: 'Upload Complete',
    type: 'success',
    action: {
        label: 'View',
        callback: () => {
            // Handle view action
        }
    }
});

// Persistent toast (won't auto-hide)
toast.show({
    message: 'Important message',
    type: 'warning',
    duration: 0  // Won't auto-hide
});

// Clear all toasts
toast.clearAll();
```

### Toast Types

- **info** (ℹ️) - Blue, informational
- **success** (✓) - Green, confirmations
- **warning** (⚠️) - Orange, warnings
- **error** (✕) - Red, errors

---

## Data Visualization

### ChartRenderer Class

Create beautiful charts and stat cards.

#### Bar Chart

```typescript
import { ChartRenderer } from './ui-enhancements';

const container = document.getElementById('my-chart');

const data = [
    { label: 'Drywall Sheets', value: 150 },
    { label: 'Joint Compound', value: 25 },
    { label: 'Screws (lbs)', value: 12 },
    { label: 'Tape (rolls)', value: 8 }
];

ChartRenderer.createBarChart(container, data);
```

#### Donut Chart

```typescript
const data = [
    { label: 'Materials', value: 5000, color: '#0078d4' },
    { label: 'Labor', value: 3500, color: '#50e3c2' },
    { label: 'Markup', value: 1500, color: '#107c10' }
];

ChartRenderer.createDonutChart(container, data, 'Total Cost');
```

#### Stat Card

```typescript
ChartRenderer.createStatCard(
    container,
    'Total Area',
    '2,450 sq ft',
    '📐',
    { value: 15, isPositive: true } // Optional +15% indicator
);
```

---

## Animations

### AnimationUtils Class

Smooth, performant animations.

```typescript
import { AnimationUtils } from './ui-enhancements';

// Fade animations
await AnimationUtils.fadeIn(element);
await AnimationUtils.fadeOut(element);

// Slide animations
await AnimationUtils.slideDown(element);
await AnimationUtils.slideUp(element);

// Bounce effect
AnimationUtils.bounce(element);

// Shake effect (for errors)
AnimationUtils.shake(element);
```

### CSS Animation Classes

```html
<!-- Animated entrance -->
<div class="animate-fade-in">Content</div>

<!-- Floating animation -->
<div class="float">Floating card</div>

<!-- Shimmer effect -->
<div class="shimmer">Loading...</div>

<!-- Glow effect on hover -->
<button class="glow">Hover me</button>

<!-- Animated gradient -->
<div class="animated-gradient">Cool gradient</div>
```

---

## Accessibility

### AccessibilityUtils Class

WCAG 2.1 AA compliant features.

#### Focus Trapping (for modals)

```typescript
import { AccessibilityUtils } from './ui-enhancements';

const modal = document.getElementById('my-modal');
const cleanup = AccessibilityUtils.trapFocus(modal);

// Later, when closing modal:
cleanup();
```

#### Screen Reader Announcements

```typescript
// Polite (default)
AccessibilityUtils.announce('Form submitted successfully');

// Assertive (urgent)
AccessibilityUtils.announce('Error: Please fix the form', 'assertive');
```

#### Keyboard Navigation

```typescript
const list = document.getElementById('my-list');
AccessibilityUtils.addKeyboardNavigation(list, '.list-item');
// Now users can navigate with Arrow keys, Home, End
```

### Built-in Features

✅ **Skip Links** - Jump to main content
✅ **Focus Indicators** - Visible focus rings
✅ **ARIA Labels** - All interactive elements labeled
✅ **Keyboard Navigation** - Full keyboard support
✅ **Screen Reader Support** - Semantic HTML + ARIA
✅ **High Contrast Mode** - Respects system preferences
✅ **Reduced Motion** - Respects prefers-reduced-motion

---

## Components

### Buttons

```html
<!-- Primary button -->
<button class="btn btn-primary">Save Project</button>

<!-- Secondary button -->
<button class="btn btn-secondary">Cancel</button>

<!-- Outline button -->
<button class="btn btn-outline">Learn More</button>

<!-- Ghost button -->
<button class="btn btn-ghost">Skip</button>

<!-- Success/Danger -->
<button class="btn btn-success">Approve</button>
<button class="btn btn-danger">Delete</button>

<!-- Sizes -->
<button class="btn btn-sm">Small</button>
<button class="btn">Default</button>
<button class="btn btn-lg">Large</button>
```

### Cards

```html
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Card Title</h3>
    </div>
    <div class="card-body">
        Card content goes here
    </div>
    <div class="card-footer">
        <button class="btn btn-primary">Action</button>
    </div>
</div>
```

### Stat Cards

```html
<div class="stat-card">
    <div class="stat-card-header">
        <div class="stat-card-title">Total Sheets</div>
        <div class="stat-card-icon">📦</div>
    </div>
    <div class="stat-card-value">245</div>
    <div class="stat-card-change positive">
        <span>↑</span>
        <span>12%</span>
    </div>
</div>
```

### Badges

```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-danger">Error</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-info">Info</span>
```

### Forms

```html
<div class="form-group">
    <label class="form-label form-label-required">Room Name</label>
    <input type="text" class="form-input" placeholder="Living Room">
    <span class="form-help">Enter a descriptive name</span>
</div>

<!-- With error -->
<div class="form-group">
    <label class="form-label">Width</label>
    <input type="number" class="form-input error" value="-5">
    <span class="form-error">Width must be positive</span>
</div>

<!-- Toggle switch -->
<label class="form-toggle">
    <input type="checkbox">
    <span class="toggle-switch"></span>
    <span>Include ceiling</span>
</label>
```

### Modals

```html
<div id="my-modal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Modal Title</h2>
            <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
            Modal content
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary">Cancel</button>
            <button class="btn btn-primary">Save</button>
        </div>
    </div>
</div>
```

```typescript
import { modal } from './ui-enhancements';

// Open modal
modal.open('my-modal');

// Close modal
modal.close();

// Check if modal is open
if (modal.isOpen()) {
    // Do something
}
```

### Progress Bars

```html
<div class="progress-bar">
    <div class="progress-bar-fill" style="width: 65%;"></div>
</div>
```

### Accordion

```html
<div class="accordion-item">
    <div class="accordion-header">
        <span>Section Title</span>
        <span class="accordion-icon">▼</span>
    </div>
    <div class="accordion-content">
        <div class="accordion-body">
            Content goes here
        </div>
    </div>
</div>
```

```javascript
// Toggle accordion
item.classList.toggle('open');
```

---

## Responsive Design

### Breakpoints

- **Mobile Portrait**: 0px - 640px
- **Mobile Landscape**: 640px - 768px
- **Tablet Portrait**: 768px - 900px
- **Tablet Landscape**: 900px - 1024px
- **Laptop**: 1024px - 1200px
- **Desktop**: 1200px - 1920px
- **Large Desktop**: 1920px+

### Responsive Utilities

```html
<!-- Hide on mobile -->
<div class="hidden-mobile">Desktop only</div>

<!-- Show only on mobile -->
<div class="show-mobile">Mobile only</div>

<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    <!-- Content -->
</div>
```

### Touch Optimization

- Minimum touch target: 44x44px
- Larger tap areas on mobile
- Optimized hover states for touch devices
- Gesture support ready

---

## Keyboard Shortcuts

### Built-in Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+T` | Toggle theme (dark/light) |
| `Alt+P` | Toggle side panel |
| `/` | Focus search |
| `?` | Show help |
| `Escape` | Close modal |
| `Arrow Keys` | Navigate lists |
| `Home` | Jump to first item |
| `End` | Jump to last item |

### Adding Custom Shortcuts

Edit `ui-init.ts`:

```typescript
const shortcuts: Record<string, () => void> = {
    'Ctrl+K': () => {
        // Your custom action
    }
};
```

---

## API Reference

### Theme

```typescript
theme.toggle(): void
theme.set(theme: 'light' | 'dark'): void
theme.get(): 'light' | 'dark'
theme.isDark(): boolean
```

### Toast

```typescript
toast.show(options: ToastOptions): string
toast.success(message: string, title?: string): string
toast.error(message: string, title?: string): string
toast.warning(message: string, title?: string): string
toast.info(message: string, title?: string): string
toast.hide(toastId: string): void
toast.clearAll(): void
```

### Modal

```typescript
modal.open(modalId: string): void
modal.close(): void
modal.isOpen(): boolean
```

### Loading

```typescript
loading.show(message?: string): void
loading.hide(): void
loading.wrap<T>(promise: Promise<T>, message?: string): Promise<T>
```

### ChartRenderer

```typescript
ChartRenderer.createBarChart(container: HTMLElement, data: ChartData[]): void
ChartRenderer.createDonutChart(container: HTMLElement, data: ChartData[], totalLabel?: string): void
ChartRenderer.createStatCard(container: HTMLElement, title: string, value: number | string, icon: string, change?: { value: number; isPositive: boolean }): void
```

### AnimationUtils

```typescript
AnimationUtils.fadeIn(element: HTMLElement, duration?: number): Promise<void>
AnimationUtils.fadeOut(element: HTMLElement, duration?: number): Promise<void>
AnimationUtils.slideDown(element: HTMLElement, duration?: number): Promise<void>
AnimationUtils.slideUp(element: HTMLElement, duration?: number): Promise<void>
AnimationUtils.bounce(element: HTMLElement): void
AnimationUtils.shake(element: HTMLElement): void
```

### AccessibilityUtils

```typescript
AccessibilityUtils.trapFocus(container: HTMLElement): () => void
AccessibilityUtils.announce(message: string, priority?: 'polite' | 'assertive'): void
AccessibilityUtils.addKeyboardNavigation(container: HTMLElement, itemSelector: string): void
```

---

## Utility Classes

### Display

```css
.hidden          /* display: none */
.visible         /* display: block */
.flex            /* display: flex */
.grid            /* display: grid */
```

### Spacing

```css
.m-0, .m-1, .m-2, .m-3, .m-4    /* Margin */
.p-0, .p-1, .p-2, .p-3, .p-4    /* Padding */
.gap-1, .gap-2, .gap-3, .gap-4  /* Gap */
```

### Flexbox

```css
.flex-row        /* flex-direction: row */
.flex-col        /* flex-direction: column */
.items-center    /* align-items: center */
.justify-center  /* justify-content: center */
.justify-between /* justify-content: space-between */
```

### Text

```css
.text-left       /* text-align: left */
.text-center     /* text-align: center */
.text-right      /* text-align: right */
.font-medium     /* font-weight: 500 */
.font-semibold   /* font-weight: 600 */
.font-bold       /* font-weight: 700 */
.truncate        /* Ellipsis overflow */
```

### Colors

```css
.text-primary    .text-secondary   .text-muted
.text-success    .text-danger      .text-warning
.bg-primary      .bg-secondary     .bg-tertiary
```

### Borders & Shadows

```css
.rounded-sm      .rounded-md       .rounded-lg
.rounded-xl      .rounded-full
.shadow-sm       .shadow-md        .shadow-lg
```

---

## Print Styles

The application includes optimized print styles that:

✅ Hide UI chrome (ribbons, panels, buttons)
✅ Optimize colors for printing
✅ Add proper page breaks
✅ Set appropriate margins
✅ Preserve blueprint canvas at full page

### Usage

Simply use the browser's print function (Ctrl+P / Cmd+P).

---

## Best Practices

### Performance

1. Use CSS animations over JavaScript when possible
2. Debounce expensive operations
3. Lazy-load heavy components
4. Use `will-change` sparingly
5. Optimize images and assets

### Accessibility

1. Always provide alt text for images
2. Use semantic HTML
3. Ensure keyboard navigation works
4. Test with screen readers
5. Maintain 4.5:1 contrast ratio
6. Add ARIA labels where needed

### Responsive Design

1. Mobile-first approach
2. Test on real devices
3. Use relative units (rem, em, %)
4. Optimize touch targets (44x44px minimum)
5. Consider landscape orientation

---

## Troubleshooting

### Theme not switching

Check if `data-theme` attribute is set on `<html>`:

```javascript
console.log(document.documentElement.getAttribute('data-theme'));
```

### Toasts not showing

Ensure the toast container exists:

```javascript
console.log(document.querySelector('.toast-container'));
```

### Animations not working

Check for `prefers-reduced-motion`:

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
console.log({ prefersReducedMotion });
```

### Dark mode colors wrong

Clear localStorage and refresh:

```javascript
localStorage.removeItem('theme');
location.reload();
```

---

## Examples

### Complete Modal with Chart

```typescript
import { modal, ChartRenderer } from './ui-enhancements';

// Create modal
const modalHTML = `
    <div id="chart-modal" class="modal">
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2>Material Breakdown</h2>
                <button class="modal-close">×</button>
            </div>
            <div class="modal-body">
                <div id="chart-container"></div>
            </div>
        </div>
    </div>
`;
document.body.insertAdjacentHTML('beforeend', modalHTML);

// Open and show chart
modal.open('chart-modal');

const data = [
    { label: 'Drywall', value: 5000 },
    { label: 'Labor', value: 3500 },
    { label: 'Materials', value: 1500 }
];

const container = document.getElementById('chart-container');
ChartRenderer.createDonutChart(container, data, 'Total Cost');
```

### Form with Validation and Toast

```typescript
import { toast, AnimationUtils } from './ui-enhancements';

const form = document.getElementById('my-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const input = form.querySelector('input');
    if (!input.value) {
        AnimationUtils.shake(input);
        toast.error('Please fill in all fields', 'Validation Error');
        return;
    }

    try {
        await saveData(input.value);
        toast.success('Data saved successfully!');
        form.reset();
    } catch (error) {
        toast.error('Failed to save data', 'Error');
    }
});
```

---

## License

MIT License - Feel free to use these enhancements in your projects!

---

## Support

For issues or questions:
- Check the troubleshooting section
- Review the API reference
- Inspect browser console for errors
- Test with different themes and screen sizes

---

**Last Updated**: 2025-11-10
**Version**: 2.0
**Author**: Claude Code AI
