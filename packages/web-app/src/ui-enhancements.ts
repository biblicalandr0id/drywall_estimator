/**
 * UI Enhancements Library
 * Comprehensive UI utilities for the Drywall Estimator application
 * Includes: Theme management, Toast notifications, Charts, Animations, Accessibility
 */

/* ==================== TYPES ==================== */

interface ToastOptions {
    message: string;
    title?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    action?: {
        label: string;
        callback: () => void;
    };
}

interface ChartData {
    label: string;
    value: number;
    color?: string;
}

/* ==================== THEME MANAGER ==================== */

export class ThemeManager {
    private currentTheme: 'light' | 'dark' = 'light';
    private prefersDark: MediaQueryList;

    constructor() {
        this.prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        this.init();
    }

    private init(): void {
        // Check saved preference
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else {
            this.currentTheme = this.prefersDark.matches ? 'dark' : 'light';
        }

        this.apply();

        // Listen for system theme changes
        this.prefersDark.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.currentTheme = e.matches ? 'dark' : 'light';
                this.apply();
            }
        });
    }

    private apply(): void {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.dispatchThemeChange();
    }

    private dispatchThemeChange(): void {
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: this.currentTheme }
        }));
    }

    toggle(): void {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.apply();
    }

    set(theme: 'light' | 'dark'): void {
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        this.apply();
    }

    get(): 'light' | 'dark' {
        return this.currentTheme;
    }

    isDark(): boolean {
        return this.currentTheme === 'dark';
    }
}

/* ==================== TOAST NOTIFICATIONS ==================== */

export class ToastManager {
    private container: HTMLElement;
    private toasts: Map<string, HTMLElement> = new Map();

    constructor() {
        this.container = this.createContainer();
    }

    private createContainer(): HTMLElement {
        let container = document.querySelector('.toast-container') as HTMLElement;
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    private createToast(options: ToastOptions): HTMLElement {
        const { message, title, type = 'info', action } = options;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = this.getIcon(type);

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            ${action ? `<button class="btn btn-sm btn-ghost toast-action">${action.label}</button>` : ''}
            <button class="toast-close">×</button>
        `;

        // Add action handler
        if (action) {
            const actionBtn = toast.querySelector('.toast-action');
            actionBtn?.addEventListener('click', () => {
                action.callback();
                this.hide(toast);
            });
        }

        // Add close handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn?.addEventListener('click', () => this.hide(toast));

        return toast;
    }

    private getIcon(type: string): string {
        const icons = {
            info: 'ℹ️',
            success: '✓',
            warning: '⚠️',
            error: '✕'
        };
        return icons[type as keyof typeof icons] || icons.info;
    }

    show(options: ToastOptions): string {
        const toast = this.createToast(options);
        const id = `toast-${Date.now()}-${Math.random()}`;

        this.container.appendChild(toast);
        this.toasts.set(id, toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.style.animation = 'toastSlideIn 0.3s ease-out';
        });

        // Auto hide
        if (options.duration !== 0) {
            setTimeout(() => this.hide(toast), options.duration || 5000);
        }

        return id;
    }

    hide(toastOrId: HTMLElement | string): void {
        let toast: HTMLElement | undefined;

        if (typeof toastOrId === 'string') {
            toast = this.toasts.get(toastOrId);
            if (!toast) return;
            this.toasts.delete(toastOrId);
        } else {
            toast = toastOrId;
            // Find and remove from map
            for (const [id, el] of this.toasts.entries()) {
                if (el === toast) {
                    this.toasts.delete(id);
                    break;
                }
            }
        }

        toast.classList.add('hiding');
        setTimeout(() => {
            toast?.remove();
        }, 300);
    }

    success(message: string, title?: string): string {
        return this.show({ message, title, type: 'success' });
    }

    error(message: string, title?: string): string {
        return this.show({ message, title, type: 'error' });
    }

    warning(message: string, title?: string): string {
        return this.show({ message, title, type: 'warning' });
    }

    info(message: string, title?: string): string {
        return this.show({ message, title, type: 'info' });
    }

    clearAll(): void {
        this.toasts.forEach((toast) => this.hide(toast));
    }
}

/* ==================== CHART UTILITIES ==================== */

export class ChartRenderer {
    /**
     * Create a simple bar chart
     */
    static createBarChart(container: HTMLElement, data: ChartData[]): void {
        const maxValue = Math.max(...data.map(d => d.value));

        const chartHTML = data.map((item, index) => {
            const percentage = (item.value / maxValue) * 100;
            const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`;

            return `
                <div class="bar-chart-row">
                    <div class="bar-chart-label">${item.label}</div>
                    <div class="bar-chart-bar-container">
                        <div class="bar-chart-bar" style="width: ${percentage}%; background: ${color};">
                            <span class="bar-chart-value">${item.value}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="bar-chart">${chartHTML}</div>`;

        // Animate bars
        setTimeout(() => {
            const bars = container.querySelectorAll('.bar-chart-bar');
            bars.forEach((bar, index) => {
                setTimeout(() => {
                    (bar as HTMLElement).style.width =
                        data[index] ? `${(data[index].value / maxValue) * 100}%` : '0%';
                }, index * 100);
            });
        }, 100);
    }

    /**
     * Create a donut chart
     */
    static createDonutChart(container: HTMLElement, data: ChartData[], totalLabel = 'Total'): void {
        const total = data.reduce((sum, item) => sum + item.value, 0);

        // Calculate angles
        let currentAngle = 0;
        const segments = data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`;

            const segment = {
                startAngle: currentAngle,
                endAngle: currentAngle + angle,
                color,
                value: item.value,
                percentage
            };

            currentAngle += angle;
            return segment;
        });

        // Create CSS conic gradient
        const gradientStops = segments.map(seg =>
            `${seg.color} ${seg.startAngle}deg ${seg.endAngle}deg`
        ).join(', ');

        container.innerHTML = `
            <div class="donut-chart" style="background: conic-gradient(from 0deg, ${gradientStops});">
                <div class="donut-chart-center">
                    <div class="donut-chart-total">${total}</div>
                    <div class="donut-chart-label">${totalLabel}</div>
                </div>
            </div>
        `;

        // Add legend
        const legend = document.createElement('div');
        legend.className = 'chart-legend';
        legend.innerHTML = data.map((item, index) => {
            const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`;
            return `
                <div class="legend-item">
                    <div class="legend-color" style="background: ${color};"></div>
                    <span>${item.label}: ${item.value}</span>
                </div>
            `;
        }).join('');

        container.appendChild(legend);
    }

    /**
     * Create a stat card
     */
    static createStatCard(
        container: HTMLElement,
        title: string,
        value: number | string,
        icon: string,
        change?: { value: number; isPositive: boolean }
    ): void {
        const changeHTML = change ? `
            <div class="stat-card-change ${change.isPositive ? 'positive' : 'negative'}">
                <span>${change.isPositive ? '↑' : '↓'}</span>
                <span>${Math.abs(change.value)}%</span>
            </div>
        ` : '';

        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-card-title">${title}</div>
                    <div class="stat-card-icon">${icon}</div>
                </div>
                <div class="stat-card-value">${value}</div>
                ${changeHTML}
            </div>
        `;
    }
}

/* ==================== ANIMATION UTILITIES ==================== */

export class AnimationUtils {
    /**
     * Animate element entrance
     */
    static fadeIn(element: HTMLElement, duration = 300): Promise<void> {
        return new Promise((resolve) => {
            element.style.opacity = '0';
            element.style.display = 'block';

            requestAnimationFrame(() => {
                element.style.transition = `opacity ${duration}ms ease-in-out`;
                element.style.opacity = '1';

                setTimeout(resolve, duration);
            });
        });
    }

    /**
     * Animate element exit
     */
    static fadeOut(element: HTMLElement, duration = 300): Promise<void> {
        return new Promise((resolve) => {
            element.style.transition = `opacity ${duration}ms ease-in-out`;
            element.style.opacity = '0';

            setTimeout(() => {
                element.style.display = 'none';
                resolve();
            }, duration);
        });
    }

    /**
     * Slide element down
     */
    static slideDown(element: HTMLElement, duration = 300): Promise<void> {
        return new Promise((resolve) => {
            element.style.height = '0';
            element.style.overflow = 'hidden';
            element.style.display = 'block';

            const height = element.scrollHeight;

            requestAnimationFrame(() => {
                element.style.transition = `height ${duration}ms ease-out`;
                element.style.height = `${height}px`;

                setTimeout(() => {
                    element.style.height = 'auto';
                    element.style.overflow = '';
                    resolve();
                }, duration);
            });
        });
    }

    /**
     * Slide element up
     */
    static slideUp(element: HTMLElement, duration = 300): Promise<void> {
        return new Promise((resolve) => {
            const height = element.scrollHeight;
            element.style.height = `${height}px`;
            element.style.overflow = 'hidden';

            requestAnimationFrame(() => {
                element.style.transition = `height ${duration}ms ease-out`;
                element.style.height = '0';

                setTimeout(() => {
                    element.style.display = 'none';
                    element.style.height = '';
                    element.style.overflow = '';
                    resolve();
                }, duration);
            });
        });
    }

    /**
     * Bounce animation
     */
    static bounce(element: HTMLElement): void {
        element.style.animation = 'none';
        requestAnimationFrame(() => {
            element.style.animation = 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        });
    }

    /**
     * Shake animation (for errors)
     */
    static shake(element: HTMLElement): void {
        element.style.animation = 'none';
        requestAnimationFrame(() => {
            element.style.animation = 'shake 0.5s ease-in-out';
        });
    }
}

/* ==================== ACCESSIBILITY UTILITIES ==================== */

export class AccessibilityUtils {
    /**
     * Trap focus within a container (for modals)
     */
    static trapFocus(container: HTMLElement): () => void {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };

        container.addEventListener('keydown', handleTab);

        // Return cleanup function
        return () => {
            container.removeEventListener('keydown', handleTab);
        };
    }

    /**
     * Announce message to screen readers
     */
    static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
        let announcer = document.getElementById('a11y-announcer');

        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'a11y-announcer';
            announcer.className = 'sr-only';
            announcer.setAttribute('aria-live', priority);
            announcer.setAttribute('aria-atomic', 'true');
            document.body.appendChild(announcer);
        }

        announcer.textContent = message;

        // Clear after announcement
        setTimeout(() => {
            announcer!.textContent = '';
        }, 1000);
    }

    /**
     * Add keyboard navigation to list
     */
    static addKeyboardNavigation(container: HTMLElement, itemSelector: string): void {
        const items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[];

        container.addEventListener('keydown', (e) => {
            const currentIndex = items.indexOf(document.activeElement as HTMLElement);
            let nextIndex = -1;

            switch (e.key) {
                case 'ArrowDown':
                    nextIndex = (currentIndex + 1) % items.length;
                    break;
                case 'ArrowUp':
                    nextIndex = (currentIndex - 1 + items.length) % items.length;
                    break;
                case 'Home':
                    nextIndex = 0;
                    break;
                case 'End':
                    nextIndex = items.length - 1;
                    break;
                default:
                    return;
            }

            if (nextIndex !== -1) {
                e.preventDefault();
                items[nextIndex].focus();
            }
        });
    }
}

/* ==================== MODAL MANAGER ==================== */

export class ModalManager {
    private activeModal: HTMLElement | null = null;
    private focusTrap: (() => void) | null = null;

    open(modalId: string): void {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        this.activeModal = modal;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Trap focus
        this.focusTrap = AccessibilityUtils.trapFocus(modal);

        // Focus first focusable element
        const firstFocusable = modal.querySelector<HTMLElement>(
            'button, [href], input, select, textarea'
        );
        firstFocusable?.focus();

        // Close on escape
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        modal.addEventListener('keydown', handleEscape);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });

        // Announce to screen readers
        AccessibilityUtils.announce('Dialog opened');
    }

    close(): void {
        if (!this.activeModal) return;

        this.activeModal.classList.remove('active');
        document.body.style.overflow = '';

        if (this.focusTrap) {
            this.focusTrap();
            this.focusTrap = null;
        }

        this.activeModal = null;

        // Announce to screen readers
        AccessibilityUtils.announce('Dialog closed');
    }

    isOpen(): boolean {
        return this.activeModal !== null;
    }
}

/* ==================== LOADING MANAGER ==================== */

export class LoadingManager {
    private overlay: HTMLElement;

    constructor() {
        this.overlay = this.createOverlay();
    }

    private createOverlay(): HTMLElement {
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <p class="loading-text">Loading...</p>
            `;
            document.body.appendChild(overlay);
        }
        return overlay as HTMLElement;
    }

    show(message = 'Loading...'): void {
        const text = this.overlay.querySelector('.loading-text');
        if (text) text.textContent = message;

        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        AccessibilityUtils.announce('Loading');
    }

    hide(): void {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';

        AccessibilityUtils.announce('Loading complete');
    }

    async wrap<T>(promise: Promise<T>, message = 'Loading...'): Promise<T> {
        this.show(message);
        try {
            return await promise;
        } finally {
            this.hide();
        }
    }
}

/* ==================== EXPORT SINGLETON INSTANCES ==================== */

export const theme = new ThemeManager();
export const toast = new ToastManager();
export const modal = new ModalManager();
export const loading = new LoadingManager();

/* ==================== AUTO-INITIALIZE ==================== */

if (typeof window !== 'undefined') {
    // Make utilities available globally
    (window as any).UIEnhancements = {
        theme,
        toast,
        modal,
        loading,
        ChartRenderer,
        AnimationUtils,
        AccessibilityUtils
    };
}
