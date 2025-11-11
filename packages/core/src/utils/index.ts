/**
 * Utility Functions for Professional Drywall Estimator
 * Common helpers for geometry, conversions, and data handling
 */

const Utils = {
    /**
     * Geometry Utilities
     */
    geometry: {
        /**
         * Calculate distance between two points
         */
        distance(p1, p2) {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            return Math.sqrt(dx * dx + dy * dy);
        },

        /**
         * Calculate angle between two points in radians
         */
        angle(p1, p2) {
            return Math.atan2(p2.y - p1.y, p2.x - p1.x);
        },

        /**
         * Calculate angle in degrees
         */
        angleDeg(p1, p2) {
            return this.angle(p1, p2) * 180 / Math.PI;
        },

        /**
         * Calculate midpoint between two points
         */
        midpoint(p1, p2) {
            return {
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2
            };
        },

        /**
         * Check if point is near line segment
         */
        isPointNearLine(point, lineStart, lineEnd, threshold = 10) {
            const dist = this.distanceToLineSegment(point, lineStart, lineEnd);
            return dist <= threshold;
        },

        /**
         * Calculate distance from point to line segment
         */
        distanceToLineSegment(point, lineStart, lineEnd) {
            const length = this.distance(lineStart, lineEnd);
            if (length === 0) return this.distance(point, lineStart);

            let t = ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) +
                     (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) / (length * length);

            t = Math.max(0, Math.min(1, t));

            const projection = {
                x: lineStart.x + t * (lineEnd.x - lineStart.x),
                y: lineStart.y + t * (lineEnd.y - lineStart.y)
            };

            return this.distance(point, projection);
        },

        /**
         * Project point onto line segment
         */
        projectPointOnLine(point, lineStart, lineEnd) {
            const length = this.distance(lineStart, lineEnd);
            if (length === 0) return { ...lineStart };

            let t = ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) +
                     (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) / (length * length);

            t = Math.max(0, Math.min(1, t));

            return {
                x: lineStart.x + t * (lineEnd.x - lineStart.x),
                y: lineStart.y + t * (lineEnd.y - lineStart.y)
            };
        },

        /**
         * Calculate area of polygon using shoelace formula
         */
        polygonArea(points) {
            let area = 0;
            for (let i = 0; i < points.length; i++) {
                const j = (i + 1) % points.length;
                area += points[i].x * points[j].y;
                area -= points[j].x * points[i].y;
            }
            return Math.abs(area / 2);
        },

        /**
         * Calculate center of polygon
         */
        polygonCenter(points) {
            const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
            const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
            return { x, y };
        },

        /**
         * Check if point is inside polygon
         */
        isPointInPolygon(point, polygon) {
            let inside = false;
            for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                const xi = polygon[i].x, yi = polygon[i].y;
                const xj = polygon[j].x, yj = polygon[j].y;

                const intersect = ((yi > point.y) !== (yj > point.y))
                    && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        },

        /**
         * Snap point to grid
         */
        snapToGrid(point, gridSize, offset = { x: 0, y: 0 }) {
            return {
                x: Math.round((point.x - offset.x) / gridSize) * gridSize + offset.x,
                y: Math.round((point.y - offset.y) / gridSize) * gridSize + offset.y
            };
        },

        /**
         * Rotate point around origin
         */
        rotatePoint(point, origin, angle) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const dx = point.x - origin.x;
            const dy = point.y - origin.y;

            return {
                x: origin.x + dx * cos - dy * sin,
                y: origin.y + dx * sin + dy * cos
            };
        },

        /**
         * Get bounding box of points
         */
        getBoundingBox(points) {
            if (points.length === 0) return null;

            const xs = points.map(p => p.x);
            const ys = points.map(p => p.y);

            return {
                minX: Math.min(...xs),
                maxX: Math.max(...xs),
                minY: Math.min(...ys),
                maxY: Math.max(...ys),
                width: Math.max(...xs) - Math.min(...xs),
                height: Math.max(...ys) - Math.min(...ys)
            };
        },

        /**
         * Check if two bounding boxes intersect
         */
        doBoundingBoxesIntersect(bb1, bb2) {
            return !(bb1.maxX < bb2.minX ||
                    bb1.minX > bb2.maxX ||
                    bb1.maxY < bb2.minY ||
                    bb1.minY > bb2.maxY);
        }
    },

    /**
     * Unit Conversion Utilities
     */
    units: {
        /**
         * Convert pixels to feet
         */
        pixelsToFeet(pixels, scale) {
            return pixels / scale;
        },

        /**
         * Convert feet to pixels
         */
        feetToPixels(feet, scale) {
            return feet * scale;
        },

        /**
         * Convert square feet to square meters
         */
        sqFtToSqM(sqFt) {
            return sqFt * 0.092903;
        },

        /**
         * Convert square meters to square feet
         */
        sqMToSqFt(sqM) {
            return sqM * 10.7639;
        },

        /**
         * Format number as currency
         */
        formatCurrency(amount, decimals = 2) {
            return `$${amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
        },

        /**
         * Format number with commas
         */
        formatNumber(num, decimals = 0) {
            return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        },

        /**
         * Format area with unit
         */
        formatArea(sqFt, decimals = 1) {
            return `${this.formatNumber(sqFt, decimals)} sq ft`;
        },

        /**
         * Format length with unit
         */
        formatLength(feet, decimals = 1) {
            return `${this.formatNumber(feet, decimals)}'`;
        },

        /**
         * Convert inches to feet
         */
        inchesToFeet(inches) {
            return inches / 12;
        },

        /**
         * Convert feet to inches
         */
        feetToInches(feet) {
            return feet * 12;
        },

        /**
         * Parse dimension string (e.g., "12'6\"" to 12.5 feet)
         */
        parseDimension(str) {
            const feetMatch = str.match(/(\d+)'/);
            const inchesMatch = str.match(/(\d+)"/);

            const feet = feetMatch ? parseFloat(feetMatch[1]) : 0;
            const inches = inchesMatch ? parseFloat(inchesMatch[1]) : 0;

            return feet + inches / 12;
        }
    },

    /**
     * DOM Utilities
     */
    dom: {
        /**
         * Create element with classes and attributes
         */
        createElement(tag, className = '', attributes = {}) {
            const element = document.createElement(tag);
            if (className) element.className = className;
            Object.entries(attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
            return element;
        },

        /**
         * Remove all children from element
         */
        clearElement(element) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        },

        /**
         * Show element
         */
        show(element) {
            element.classList.remove('hidden');
        },

        /**
         * Hide element
         */
        hide(element) {
            element.classList.add('hidden');
        },

        /**
         * Toggle element visibility
         */
        toggle(element) {
            element.classList.toggle('hidden');
        },

        /**
         * Add multiple event listeners
         */
        addEventListeners(element, events) {
            Object.entries(events).forEach(([event, handler]) => {
                element.addEventListener(event, handler);
            });
        }
    },

    /**
     * Data Storage Utilities
     */
    storage: {
        /**
         * Save to localStorage
         */
        save(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (e) {
                console.error('Failed to save to localStorage:', e);
                return false;
            }
        },

        /**
         * Load from localStorage
         */
        load(key) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                console.error('Failed to load from localStorage:', e);
                return null;
            }
        },

        /**
         * Remove from localStorage
         */
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Failed to remove from localStorage:', e);
                return false;
            }
        },

        /**
         * Clear all localStorage
         */
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('Failed to clear localStorage:', e);
                return false;
            }
        }
    },

    /**
     * File Utilities
     */
    file: {
        /**
         * Download data as JSON file
         */
        downloadJSON(data, filename) {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            this.downloadBlob(blob, filename);
        },

        /**
         * Download blob as file
         */
        downloadBlob(blob, filename) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },

        /**
         * Read file as text
         */
        readFileAsText(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e);
                reader.readAsText(file);
            });
        },

        /**
         * Read file as data URL
         */
        readFileAsDataURL(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e);
                reader.readAsDataURL(file);
            });
        },

        /**
         * Generate filename with timestamp
         */
        generateFilename(prefix, extension) {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            return `${prefix}_${timestamp}.${extension}`;
        }
    },

    /**
     * Validation Utilities
     */
    validate: {
        /**
         * Validate number in range
         */
        numberInRange(value, min, max) {
            const num = parseFloat(value);
            return !isNaN(num) && num >= min && num <= max;
        },

        /**
         * Validate positive number
         */
        positiveNumber(value) {
            const num = parseFloat(value);
            return !isNaN(num) && num > 0;
        },

        /**
         * Validate non-negative number
         */
        nonNegativeNumber(value) {
            const num = parseFloat(value);
            return !isNaN(num) && num >= 0;
        },

        /**
         * Validate email
         */
        email(value) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(value);
        },

        /**
         * Validate phone number
         */
        phone(value) {
            const re = /^\d{10}$/;
            return re.test(value.replace(/\D/g, ''));
        }
    },

    /**
     * Array Utilities
     */
    array: {
        /**
         * Remove item from array
         */
        remove(array, item) {
            const index = array.indexOf(item);
            if (index > -1) {
                array.splice(index, 1);
            }
            return array;
        },

        /**
         * Remove item at index
         */
        removeAt(array, index) {
            if (index >= 0 && index < array.length) {
                array.splice(index, 1);
            }
            return array;
        },

        /**
         * Get unique items
         */
        unique(array) {
            return [...new Set(array)];
        },

        /**
         * Group array by key
         */
        groupBy(array, key) {
            return array.reduce((groups, item) => {
                const group = item[key];
                groups[group] = groups[group] || [];
                groups[group].push(item);
                return groups;
            }, {});
        },

        /**
         * Sum array values
         */
        sum(array) {
            return array.reduce((sum, val) => sum + val, 0);
        },

        /**
         * Average of array values
         */
        average(array) {
            return array.length > 0 ? this.sum(array) / array.length : 0;
        }
    },

    /**
     * Object Utilities
     */
    object: {
        /**
         * Deep clone object
         */
        clone(obj) {
            return JSON.parse(JSON.stringify(obj));
        },

        /**
         * Merge objects
         */
        merge(...objects) {
            return Object.assign({}, ...objects);
        },

        /**
         * Pick specific keys from object
         */
        pick(obj, keys) {
            return keys.reduce((result, key) => {
                if (key in obj) {
                    result[key] = obj[key];
                }
                return result;
            }, {});
        },

        /**
         * Omit specific keys from object
         */
        omit(obj, keys) {
            return Object.keys(obj).reduce((result, key) => {
                if (!keys.includes(key)) {
                    result[key] = obj[key];
                }
                return result;
            }, {});
        }
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Generate unique ID
     */
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Clamp value between min and max
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Linear interpolation
     */
    lerp(start, end, amount) {
        return start + (end - start) * amount;
    },

    /**
     * Map value from one range to another
     */
    mapRange(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }
};

// Export as ES module
export default Utils;
