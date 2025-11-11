/**
 * UI Initialization Script
 * Automatically initializes all UI enhancements when the page loads
 */

import { theme, toast, modal, loading } from './ui-enhancements';

export function initializeUI(): void {
    console.log('🎨 Initializing UI Enhancements...');

    // Initialize theme
    initTheme();

    // Add theme toggle to header
    addThemeToggle();

    // Initialize side panel toggle
    initSidePanel();

    // Initialize tooltips
    initTooltips();

    // Initialize keyboard shortcuts
    initKeyboardShortcuts();

    // Initialize modals
    initModals();

    // Add loading indicators to async operations
    initLoadingStates();

    // Initialize accessibility features
    initAccessibility();

    // Welcome toast
    setTimeout(() => {
        toast.success(
            'All UI enhancements loaded successfully!',
            'Welcome'
        );
    }, 500);

    console.log('✅ UI Enhancements initialized');
}

function initTheme(): void {
    // Theme is auto-initialized by ThemeManager
    // Listen for theme changes
    window.addEventListener('themechange', (e: Event) => {
        const customEvent = e as CustomEvent;
        console.log(`Theme changed to: ${customEvent.detail.theme}`);

        // Update any theme-specific elements
        updateThemeSpecificElements(customEvent.detail.theme);
    });
}

function addThemeToggle(): void {
    const quickAccess = document.querySelector('.quick-access');
    if (!quickAccess) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'icon-btn';
    toggleBtn.id = 'theme-toggle-btn';
    toggleBtn.title = 'Toggle Dark Mode';
    toggleBtn.setAttribute('aria-label', 'Toggle dark mode');
    toggleBtn.innerHTML = theme.isDark() ? '🌙' : '☀️';

    toggleBtn.addEventListener('click', () => {
        theme.toggle();
        toggleBtn.innerHTML = theme.isDark() ? '🌙' : '☀️';
        toggleBtn.title = theme.isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode';

        // Show toast
        toast.info(
            `${theme.isDark() ? 'Dark' : 'Light'} mode activated`,
            'Theme Changed'
        );
    });

    quickAccess.insertBefore(toggleBtn, quickAccess.firstChild);
}

function updateThemeSpecificElements(theme: string): void {
    // Update canvas colors if needed
    const event = new CustomEvent('theme-updated', { detail: { theme } });
    window.dispatchEvent(event);
}

function initSidePanel(): void {
    const panel = document.getElementById('side-panel');
    const toggle = document.getElementById('panel-toggle');

    if (!panel || !toggle) return;

    toggle.addEventListener('click', () => {
        panel.classList.toggle('collapsed');

        const icon = toggle.querySelector('.toggle-icon');
        if (icon) {
            icon.textContent = panel.classList.contains('collapsed') ? '◀' : '▶';
        }

        // Save preference
        localStorage.setItem('sidePanelCollapsed',
            panel.classList.contains('collapsed').toString()
        );
    });

    // Restore saved state
    const savedState = localStorage.getItem('sidePanelCollapsed');
    if (savedState === 'true') {
        panel.classList.add('collapsed');
        const icon = toggle.querySelector('.toggle-icon');
        if (icon) icon.textContent = '◀';
    }
}

function initTooltips(): void {
    // Enhanced tooltips are handled by CSS
    // This function can add dynamic tooltip content if needed

    document.querySelectorAll('[title]').forEach(element => {
        const title = element.getAttribute('title');
        if (title && !element.hasAttribute('data-tooltip')) {
            element.setAttribute('data-tooltip', title);
            element.removeAttribute('title'); // Remove native tooltip
        }
    });
}

function initKeyboardShortcuts(): void {
    const shortcuts: Record<string, () => void> = {
        // Theme toggle
        'Alt+T': () => {
            const themeBtn = document.getElementById('theme-toggle-btn');
            themeBtn?.click();
        },

        // Panel toggle
        'Alt+P': () => {
            const panelToggle = document.getElementById('panel-toggle');
            panelToggle?.click();
        },

        // Focus search (if exists)
        '/': () => {
            const searchInput = document.querySelector<HTMLInputElement>('input[type="search"]');
            searchInput?.focus();
        },

        // Show help
        '?': () => {
            const helpBtn = document.getElementById('help-btn');
            helpBtn?.click();
        }
    };

    document.addEventListener('keydown', (e) => {
        // Build shortcut string
        const parts: string[] = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');
        if (e.metaKey) parts.push('Meta');

        // Add key (if not a modifier)
        if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
            parts.push(e.key);
        }

        const shortcut = parts.join('+');

        // Execute shortcut
        if (shortcuts[shortcut]) {
            e.preventDefault();
            shortcuts[shortcut]();
        }
    });
}

function initModals(): void {
    // Close modal buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.close();
        });
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.isOpen()) {
            modal.close();
        }
    });
}

function initLoadingStates(): void {
    // Wrap fetch calls with loading indicator
    // Track concurrent requests to avoid hiding overlay prematurely
    let activeRequests = 0;
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        activeRequests++;
        if (activeRequests === 1) {
            loading.show('Loading data...');
        }
        try {
            return await originalFetch.apply(this, args);
        } finally {
            activeRequests--;
            if (activeRequests === 0) {
                loading.hide();
            }
        }
    };

    // Add loading states to forms
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
            const submitBtn = form.querySelector('[type="submit"]') as HTMLButtonElement;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Loading...';

                // Re-enable after 5 seconds max
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit';
                }, 5000);
            }
        });
    });
}

function initAccessibility(): void {
    // Add skip link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Add main content ID if not exists
    const main = document.querySelector('main, .canvas-main');
    if (main && !main.id) {
        main.id = 'main-content';
    }

    // Add aria-labels to icon-only buttons
    document.querySelectorAll('.icon-btn:not([aria-label])').forEach(btn => {
        const label = btn.getAttribute('title') || btn.textContent?.trim();
        if (label) {
            btn.setAttribute('aria-label', label);
        }
    });

    // Add role=navigation to nav elements
    document.querySelectorAll('.ribbon, .ribbon-tabs').forEach(nav => {
        if (!nav.getAttribute('role')) {
            nav.setAttribute('role', 'navigation');
        }
    });

    // Ensure all images have alt text
    document.querySelectorAll('img:not([alt])').forEach(img => {
        img.setAttribute('alt', '');
        console.warn('Image missing alt text:', img);
    });

    // Add aria-live region for announcements
    if (!document.getElementById('a11y-announcer')) {
        const announcer = document.createElement('div');
        announcer.id = 'a11y-announcer';
        announcer.className = 'sr-only';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(announcer);
    }
}

/* ==================== UTILITY FUNCTIONS ==================== */

export function showWelcomeMessage(): void {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');

    if (!hasSeenWelcome) {
        setTimeout(() => {
            toast.info(
                'Press ? for keyboard shortcuts, Alt+T to toggle theme',
                'Pro Tip',
            );

            localStorage.setItem('hasSeenWelcome', 'true');
        }, 2000);
    }
}

export function initProgressIndicators(): void {
    // Add progress bars for async operations
    const style = document.createElement('style');
    style.textContent = `
        .loading-progress {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--color-primary-600);
            transform-origin: left;
            transform: scaleX(0);
            transition: transform 0.3s ease;
            z-index: var(--z-max);
        }
    `;
    document.head.appendChild(style);

    const progressBar = document.createElement('div');
    progressBar.className = 'loading-progress';
    document.body.appendChild(progressBar);

    // Simulate progress
    window.addEventListener('fetch-start', () => {
        progressBar.style.transform = 'scaleX(0.3)';
    });

    window.addEventListener('fetch-end', () => {
        progressBar.style.transform = 'scaleX(1)';
        setTimeout(() => {
            progressBar.style.transform = 'scaleX(0)';
        }, 300);
    });
}

/* ==================== AUTO-INITIALIZE ON DOM READY ==================== */

if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeUI();
            showWelcomeMessage();
            initProgressIndicators();
        });
    } else {
        // DOM already loaded
        initializeUI();
        showWelcomeMessage();
        initProgressIndicators();
    }
}
