/**
 * Advanced Blueprint Drawing Engine
 * Handles all canvas operations, drawing tools, and blueprint management
 */

import { Utils } from '@drywall/core';

// Export BlueprintManager as default and named export
export default class BlueprintManager {
    constructor(canvasIds, options = {}) {
        // Canvas references
        this.gridCanvas = document.getElementById(canvasIds.grid);
        this.blueprintCanvas = document.getElementById(canvasIds.blueprint);
        this.overlayCanvas = document.getElementById(canvasIds.overlay);

        this.gridCtx = this.gridCanvas.getContext('2d');
        this.blueprintCtx = this.blueprintCanvas.getContext('2d');
        this.overlayCtx = this.overlayCanvas.getContext('2d');

        // Configuration
        this.scale = options.scale || 20; // pixels per foot
        this.gridSize = options.gridSize || 1; // feet
        this.zoom = 1;
        this.panOffset = { x: 0, y: 0 };

        // State
        this.currentTool = 'select';
        this.isDrawing = false;
        this.isPanning = false;
        this.startPoint = null;
        this.currentPoint = null;
        this.selectedElements = [];
        this.hoveredElement = null;

        // Data
        this.walls = [];
        this.doors = [];
        this.windows = [];
        this.stairs = [];
        this.rooms = [];
        this.textLabels = [];
        this.measurements = [];

        // Undo/Redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;

        // Settings
        this.showGrid = true;
        this.showDimensions = true;
        this.snapToGrid = true;
        this.showRoomLabels = true;

        // Layers visibility
        this.layers = {
            walls: true,
            doors: true,
            windows: true,
            stairs: true,
            rooms: true
        };

        // Colors
        this.colors = {
            wallExterior: '#1f2937',
            wallInterior: '#4b5563',
            wallPartition: '#9ca3af',
            doorInterior: '#92400e',
            doorExterior: '#713f12',
            window: '#1e40af',
            stairs: '#7c2d12',
            roomFill: 'rgba(59, 130, 246, 0.05)',
            roomBorder: 'rgba(59, 130, 246, 0.3)',
            selected: '#3b82f6',
            hovered: '#60a5fa',
            grid: '#e5e7eb',
            gridMajor: '#d1d5db'
        };

        // Initialize
        this.init();
    }

    init() {
        this.resize();
        this.setupEventListeners();
        this.draw();
    }

    resize() {
        const container = this.blueprintCanvas.parentElement;
        const rect = container.getBoundingClientRect();

        [this.gridCanvas, this.blueprintCanvas, this.overlayCanvas].forEach(canvas => {
            canvas.width = rect.width;
            canvas.height = rect.height;
        });

        this.draw();
    }

    setupEventListeners() {
        // Mouse events
        this.blueprintCanvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.blueprintCanvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.blueprintCanvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.blueprintCanvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.blueprintCanvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));

        // Context menu
        this.blueprintCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Window resize
        window.addEventListener('resize', Utils.debounce(() => this.resize(), 250));
    }

    // ==================== DRAWING METHODS ====================

    draw() {
        this.drawGrid();
        this.drawBlueprint();
        this.drawOverlay();
    }

    drawGrid() {
        if (!this.showGrid) {
            this.gridCtx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
            return;
        }

        const ctx = this.gridCtx;
        const width = this.gridCanvas.width;
        const height = this.gridCanvas.height;

        ctx.clearRect(0, 0, width, height);

        const gridSpacing = this.scale * this.gridSize * this.zoom;
        const majorGridSpacing = gridSpacing * 5;

        // Calculate grid offset
        const offsetX = this.panOffset.x % gridSpacing;
        const offsetY = this.panOffset.y % gridSpacing;
        const majorOffsetX = this.panOffset.x % majorGridSpacing;
        const majorOffsetY = this.panOffset.y % majorGridSpacing;

        // Draw minor grid lines
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = offsetX; x < width; x += gridSpacing) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }

        for (let y = offsetY; y < height; y += gridSpacing) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }

        ctx.stroke();

        // Draw major grid lines
        ctx.strokeStyle = this.colors.gridMajor;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let x = majorOffsetX; x < width; x += majorGridSpacing) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }

        for (let y = majorOffsetY; y < height; y += majorGridSpacing) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }

        ctx.stroke();
    }

    drawBlueprint() {
        const ctx = this.blueprintCtx;
        ctx.clearRect(0, 0, this.blueprintCanvas.width, this.blueprintCanvas.height);

        ctx.save();

        // Apply transformations
        ctx.translate(this.panOffset.x, this.panOffset.y);
        ctx.scale(this.zoom, this.zoom);

        // Draw in order: rooms -> walls -> doors -> windows -> stairs -> labels
        if (this.layers.rooms) this.drawRooms(ctx);
        if (this.layers.walls) this.drawWalls(ctx);
        if (this.layers.doors) this.drawDoors(ctx);
        if (this.layers.windows) this.drawWindows(ctx);
        if (this.layers.stairs) this.drawStairs(ctx);
        if (this.showRoomLabels) this.drawTextLabels(ctx);
        if (this.showDimensions) this.drawMeasurements(ctx);

        ctx.restore();
    }

    drawOverlay() {
        const ctx = this.overlayCtx;
        ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

        ctx.save();
        ctx.translate(this.panOffset.x, this.panOffset.y);
        ctx.scale(this.zoom, this.zoom);

        // Draw selection
        this.selectedElements.forEach(elem => {
            this.drawElementHighlight(ctx, elem, this.colors.selected);
        });

        // Draw hover
        if (this.hoveredElement && !this.selectedElements.includes(this.hoveredElement)) {
            this.drawElementHighlight(ctx, this.hoveredElement, this.colors.hovered);
        }

        // Draw current drawing
        if (this.isDrawing && this.startPoint && this.currentPoint) {
            this.drawCurrentDrawing(ctx);
        }

        ctx.restore();
    }

    drawRooms(ctx) {
        this.rooms.forEach(room => {
            if (!room.points || room.points.length < 3) return;

            // Fill
            ctx.fillStyle = this.colors.roomFill;
            ctx.beginPath();
            ctx.moveTo(room.points[0].x, room.points[0].y);
            room.points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.fill();

            // Border
            ctx.strokeStyle = this.colors.roomBorder;
            ctx.lineWidth = 1 / this.zoom;
            ctx.stroke();

            // Label
            if (room.name && room.center) {
                ctx.fillStyle = '#2563eb';
                ctx.font = `${14 / this.zoom}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(room.name, room.center.x, room.center.y);
            }
        });
    }

    drawWalls(ctx) {
        this.walls.forEach(wall => {
            const color = this.getWallColor(wall.type);
            const width = this.getWallWidth(wall.type);

            ctx.strokeStyle = color;
            ctx.lineWidth = width / this.zoom;
            ctx.lineCap = 'square';

            ctx.beginPath();
            ctx.moveTo(wall.start.x, wall.start.y);
            ctx.lineTo(wall.end.x, wall.end.y);
            ctx.stroke();

            // Draw dimension if enabled
            if (this.showDimensions) {
                this.drawWallDimension(ctx, wall);
            }
        });
    }

    drawDoors(ctx) {
        this.doors.forEach(door => {
            const color = door.type === 'door-exterior' ? this.colors.doorExterior : this.colors.doorInterior;
            const width = door.width || 3; // Default 3 feet

            ctx.strokeStyle = color;
            ctx.lineWidth = 3 / this.zoom;

            // Draw door frame
            ctx.beginPath();
            ctx.moveTo(door.start.x, door.start.y);
            ctx.lineTo(door.end.x, door.end.y);
            ctx.stroke();

            // Draw door swing arc
            const length = Utils.geometry.distance(door.start, door.end);
            const angle = Utils.geometry.angle(door.start, door.end);

            ctx.beginPath();
            ctx.arc(
                door.start.x,
                door.start.y,
                length,
                angle + Math.PI / 2,
                angle + Math.PI,
                false
            );
            ctx.stroke();

            // Draw door panel
            const panelEnd = {
                x: door.start.x + Math.cos(angle + Math.PI) * length,
                y: door.start.y + Math.sin(angle + Math.PI) * length
            };

            ctx.setLineDash([5 / this.zoom, 5 / this.zoom]);
            ctx.beginPath();
            ctx.moveTo(door.start.x, door.start.y);
            ctx.lineTo(panelEnd.x, panelEnd.y);
            ctx.stroke();
            ctx.setLineDash([]);
        });
    }

    drawWindows(ctx) {
        this.windows.forEach(window => {
            ctx.strokeStyle = this.colors.window;
            ctx.lineWidth = 3 / this.zoom;

            // Draw window frame
            ctx.beginPath();
            ctx.moveTo(window.start.x, window.start.y);
            ctx.lineTo(window.end.x, window.end.y);
            ctx.stroke();

            // Draw window mullions
            const angle = Utils.geometry.angle(window.start, window.end);
            const length = Utils.geometry.distance(window.start, window.end);
            const perpAngle = angle + Math.PI / 2;
            const mullionLength = 5 / this.zoom;

            const mid = Utils.geometry.midpoint(window.start, window.end);

            // Vertical mullion
            ctx.beginPath();
            ctx.moveTo(
                mid.x + Math.cos(perpAngle) * mullionLength,
                mid.y + Math.sin(perpAngle) * mullionLength
            );
            ctx.lineTo(
                mid.x - Math.cos(perpAngle) * mullionLength,
                mid.y - Math.sin(perpAngle) * mullionLength
            );
            ctx.stroke();

            // Horizontal mullions (two panes)
            const quarter1 = {
                x: window.start.x + (window.end.x - window.start.x) * 0.25,
                y: window.start.y + (window.end.y - window.start.y) * 0.25
            };
            const quarter3 = {
                x: window.start.x + (window.end.x - window.start.x) * 0.75,
                y: window.start.y + (window.end.y - window.start.y) * 0.75
            };

            [quarter1, quarter3].forEach(point => {
                ctx.beginPath();
                ctx.moveTo(
                    point.x + Math.cos(perpAngle) * mullionLength,
                    point.y + Math.sin(perpAngle) * mullionLength
                );
                ctx.lineTo(
                    point.x - Math.cos(perpAngle) * mullionLength,
                    point.y - Math.sin(perpAngle) * mullionLength
                );
                ctx.stroke();
            });
        });
    }

    drawStairs(ctx) {
        this.stairs.forEach(stair => {
            const { start, end, type, risers = 14 } = stair;

            ctx.strokeStyle = this.colors.stairs;
            ctx.fillStyle = 'rgba(124, 45, 18, 0.1)';
            ctx.lineWidth = 2 / this.zoom;

            const length = Utils.geometry.distance(start, end);
            const angle = Utils.geometry.angle(start, end);
            const width = stair.width || (length / 2);

            // Draw stairwell outline
            const corners = [
                start,
                {
                    x: start.x + Math.cos(angle) * length,
                    y: start.y + Math.sin(angle) * length
                },
                {
                    x: start.x + Math.cos(angle) * length + Math.cos(angle + Math.PI / 2) * width,
                    y: start.y + Math.sin(angle) * length + Math.sin(angle + Math.PI / 2) * width
                },
                {
                    x: start.x + Math.cos(angle + Math.PI / 2) * width,
                    y: start.y + Math.sin(angle + Math.PI / 2) * width
                }
            ];

            ctx.beginPath();
            ctx.moveTo(corners[0].x, corners[0].y);
            corners.forEach(c => ctx.lineTo(c.x, c.y));
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Draw risers
            const riserSpacing = length / risers;
            ctx.setLineDash([2 / this.zoom, 2 / this.zoom]);

            for (let i = 1; i < risers; i++) {
                const riserStart = {
                    x: start.x + Math.cos(angle) * riserSpacing * i,
                    y: start.y + Math.sin(angle) * riserSpacing * i
                };
                const riserEnd = {
                    x: riserStart.x + Math.cos(angle + Math.PI / 2) * width,
                    y: riserStart.y + Math.sin(angle + Math.PI / 2) * width
                };

                ctx.beginPath();
                ctx.moveTo(riserStart.x, riserStart.y);
                ctx.lineTo(riserEnd.x, riserEnd.y);
                ctx.stroke();
            }

            ctx.setLineDash([]);

            // Draw direction arrow
            const arrowStart = Utils.geometry.midpoint(start, {
                x: start.x + Math.cos(angle) * length,
                y: start.y + Math.sin(angle) * length
            });
            const arrowEnd = {
                x: arrowStart.x + Math.cos(angle) * (length * 0.3),
                y: arrowStart.y + Math.sin(angle) * (length * 0.3)
            };

            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3 / this.zoom;
            ctx.beginPath();
            ctx.moveTo(arrowStart.x, arrowStart.y);
            ctx.lineTo(arrowEnd.x, arrowEnd.y);

            // Arrowhead
            const arrowSize = 10 / this.zoom;
            ctx.lineTo(
                arrowEnd.x - Math.cos(angle + Math.PI / 6) * arrowSize,
                arrowEnd.y - Math.sin(angle + Math.PI / 6) * arrowSize
            );
            ctx.moveTo(arrowEnd.x, arrowEnd.y);
            ctx.lineTo(
                arrowEnd.x - Math.cos(angle - Math.PI / 6) * arrowSize,
                arrowEnd.y - Math.sin(angle - Math.PI / 6) * arrowSize
            );
            ctx.stroke();

            // Label
            ctx.fillStyle = '#000';
            ctx.font = `${12 / this.zoom}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(
                type === 'stairs-up' ? 'UP' : 'DOWN',
                arrowStart.x,
                arrowStart.y - 15 / this.zoom
            );
        });
    }

    drawTextLabels(ctx) {
        this.textLabels.forEach(label => {
            ctx.fillStyle = '#000';
            ctx.font = `${(label.fontSize || 14) / this.zoom}px sans-serif`;
            ctx.textAlign = label.align || 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(label.text, label.x, label.y);
        });
    }

    drawMeasurements(ctx) {
        this.measurements.forEach(measurement => {
            const { start, end } = measurement;
            const mid = Utils.geometry.midpoint(start, end);
            const distance = Utils.geometry.distance(start, end) / this.scale;
            const angle = Utils.geometry.angle(start, end);

            // Draw measurement line
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1 / this.zoom;
            ctx.setLineDash([3 / this.zoom, 3 / this.zoom]);
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw dimension text
            ctx.save();
            ctx.translate(mid.x, mid.y);
            ctx.rotate(angle);
            ctx.fillStyle = '#000';
            ctx.font = `${10 / this.zoom}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`${distance.toFixed(1)}'`, 0, -5 / this.zoom);
            ctx.restore();
        });
    }

    drawWallDimension(ctx, wall) {
        const mid = Utils.geometry.midpoint(wall.start, wall.end);
        const distance = Utils.geometry.distance(wall.start, wall.end) / this.scale;
        const angle = Utils.geometry.angle(wall.start, wall.end);
        const perpAngle = angle + Math.PI / 2;
        const offset = 20 / this.zoom;

        const textPos = {
            x: mid.x + Math.cos(perpAngle) * offset,
            y: mid.y + Math.sin(perpAngle) * offset
        };

        ctx.fillStyle = '#4b5563';
        ctx.font = `${10 / this.zoom}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${distance.toFixed(1)}'`, textPos.x, textPos.y);
    }

    drawCurrentDrawing(ctx) {
        const toolType = this.currentTool;

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3 / this.zoom;
        ctx.setLineDash([5 / this.zoom, 5 / this.zoom]);

        if (toolType.startsWith('wall') || toolType.startsWith('door') ||
            toolType.startsWith('window') || toolType === 'measure') {
            ctx.beginPath();
            ctx.moveTo(this.startPoint.x, this.startPoint.y);
            ctx.lineTo(this.currentPoint.x, this.currentPoint.y);
            ctx.stroke();

            // Show distance
            const distance = Utils.geometry.distance(this.startPoint, this.currentPoint) / this.scale;
            const mid = Utils.geometry.midpoint(this.startPoint, this.currentPoint);

            ctx.fillStyle = '#000';
            ctx.font = `${12 / this.zoom}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(`${distance.toFixed(1)}'`, mid.x, mid.y - 10 / this.zoom);
        } else if (toolType.startsWith('stairs')) {
            // Draw stairs preview
            const length = Utils.geometry.distance(this.startPoint, this.currentPoint);
            const angle = Utils.geometry.angle(this.startPoint, this.currentPoint);
            const width = length / 2;

            const corners = [
                this.startPoint,
                this.currentPoint,
                {
                    x: this.currentPoint.x + Math.cos(angle + Math.PI / 2) * width,
                    y: this.currentPoint.y + Math.sin(angle + Math.PI / 2) * width
                },
                {
                    x: this.startPoint.x + Math.cos(angle + Math.PI / 2) * width,
                    y: this.startPoint.y + Math.sin(angle + Math.PI / 2) * width
                }
            ];

            ctx.beginPath();
            ctx.moveTo(corners[0].x, corners[0].y);
            corners.forEach(c => ctx.lineTo(c.x, c.y));
            ctx.closePath();
            ctx.stroke();
        }

        ctx.setLineDash([]);
    }

    drawElementHighlight(ctx, element, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 6 / this.zoom;

        if (element.start && element.end) {
            ctx.beginPath();
            ctx.moveTo(element.start.x, element.start.y);
            ctx.lineTo(element.end.x, element.end.y);
            ctx.stroke();
        } else if (element.points) {
            ctx.beginPath();
            ctx.moveTo(element.points[0].x, element.points[0].y);
            element.points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.stroke();
        }
    }

    // ==================== HELPER METHODS ====================

    getWallColor(type) {
        switch (type) {
            case 'wall-exterior': return this.colors.wallExterior;
            case 'wall-interior': return this.colors.wallInterior;
            case 'wall-partition': return this.colors.wallPartition;
            default: return this.colors.wallInterior;
        }
    }

    getWallWidth(type) {
        switch (type) {
            case 'wall-exterior': return 8;
            case 'wall-interior': return 6;
            case 'wall-partition': return 4;
            default: return 6;
        }
    }

    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.panOffset.x) / this.zoom,
            y: (screenY - this.panOffset.y) / this.zoom
        };
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX * this.zoom + this.panOffset.x,
            y: worldY * this.zoom + this.panOffset.y
        };
    }

    snapPoint(point) {
        if (!this.snapToGrid) return point;
        return Utils.geometry.snapToGrid(point, this.scale * this.gridSize);
    }

    getMousePosition(event) {
        const rect = this.blueprintCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return this.screenToWorld(x, y);
    }

    findElementAtPoint(point, threshold = 10) {
        threshold = threshold / this.zoom;

        // Check in reverse order (top to bottom)
        // Check stairs
        for (let i = this.stairs.length - 1; i >= 0; i--) {
            if (this.isPointInStairs(point, this.stairs[i], threshold)) {
                return { type: 'stairs', element: this.stairs[i], index: i };
            }
        }

        // Check doors
        for (let i = this.doors.length - 1; i >= 0; i--) {
            if (Utils.geometry.isPointNearLine(point, this.doors[i].start, this.doors[i].end, threshold)) {
                return { type: 'door', element: this.doors[i], index: i };
            }
        }

        // Check windows
        for (let i = this.windows.length - 1; i >= 0; i--) {
            if (Utils.geometry.isPointNearLine(point, this.windows[i].start, this.windows[i].end, threshold)) {
                return { type: 'window', element: this.windows[i], index: i };
            }
        }

        // Check walls
        for (let i = this.walls.length - 1; i >= 0; i--) {
            if (Utils.geometry.isPointNearLine(point, this.walls[i].start, this.walls[i].end, threshold)) {
                return { type: 'wall', element: this.walls[i], index: i };
            }
        }

        // Check rooms
        for (let i = this.rooms.length - 1; i >= 0; i--) {
            if (this.rooms[i].points && Utils.geometry.isPointInPolygon(point, this.rooms[i].points)) {
                return { type: 'room', element: this.rooms[i], index: i };
            }
        }

        return null;
    }

    isPointInStairs(point, stair, threshold) {
        const { start, end } = stair;
        const length = Utils.geometry.distance(start, end);
        const angle = Utils.geometry.angle(start, end);
        const width = stair.width || (length / 2);

        const corners = [
            start,
            { x: start.x + Math.cos(angle) * length, y: start.y + Math.sin(angle) * length },
            {
                x: start.x + Math.cos(angle) * length + Math.cos(angle + Math.PI / 2) * width,
                y: start.y + Math.sin(angle) * length + Math.sin(angle + Math.PI / 2) * width
            },
            {
                x: start.x + Math.cos(angle + Math.PI / 2) * width,
                y: start.y + Math.sin(angle + Math.PI / 2) * width
            }
        ];

        return Utils.geometry.isPointInPolygon(point, corners);
    }

    // ==================== EVENT HANDLERS ====================

    handleMouseDown(event) {
        const point = this.getMousePosition(event);

        // Pan with middle mouse or Ctrl+Left
        if (event.button === 1 || (event.button === 0 && event.ctrlKey)) {
            this.isPanning = true;
            this.lastPanPoint = { x: event.clientX, y: event.clientY };
            this.blueprintCanvas.style.cursor = 'grabbing';
            return;
        }

        if (event.button !== 0) return;

        if (this.currentTool === 'select') {
            const found = this.findElementAtPoint(point);
            if (found) {
                if (!event.shiftKey) {
                    this.selectedElements = [];
                }
                if (!this.selectedElements.includes(found.element)) {
                    this.selectedElements.push(found.element);
                }
            } else {
                this.selectedElements = [];
            }
            this.draw();
        } else if (this.currentTool === 'erase') {
            const found = this.findElementAtPoint(point);
            if (found) {
                this.deleteElement(found);
            }
        } else {
            // Start drawing
            this.isDrawing = true;
            this.startPoint = this.snapPoint(point);
            this.currentPoint = this.startPoint;
        }
    }

    handleMouseMove(event) {
        const point = this.getMousePosition(event);

        if (this.isPanning) {
            const dx = event.clientX - this.lastPanPoint.x;
            const dy = event.clientY - this.lastPanPoint.y;

            this.panOffset.x += dx;
            this.panOffset.y += dy;

            this.lastPanPoint = { x: event.clientX, y: event.clientY };
            this.draw();
            return;
        }

        if (this.isDrawing) {
            this.currentPoint = this.snapPoint(point);
            this.draw();
        } else {
            // Update hover state
            const found = this.findElementAtPoint(point);
            if (found && found.element !== this.hoveredElement) {
                this.hoveredElement = found.element;
                this.draw();
            } else if (!found && this.hoveredElement) {
                this.hoveredElement = null;
                this.draw();
            }
        }

        // Update cursor position display
        const worldPoint = point;
        const feetX = worldPoint.x / this.scale;
        const feetY = worldPoint.y / this.scale;
        this.updateCursorDisplay(feetX, feetY);
    }

    handleMouseUp(event) {
        if (this.isPanning) {
            this.isPanning = false;
            this.blueprintCanvas.style.cursor = 'default';
            return;
        }

        if (!this.isDrawing) return;

        this.isDrawing = false;

        if (!this.startPoint || !this.currentPoint) return;

        const distance = Utils.geometry.distance(this.startPoint, this.currentPoint);
        if (distance < 5) return; // Ignore tiny elements

        this.createElement(this.currentTool, this.startPoint, this.currentPoint);

        this.startPoint = null;
        this.currentPoint = null;
        this.draw();
    }

    handleWheel(event) {
        event.preventDefault();

        const point = this.getMousePosition(event);
        const prevZoom = this.zoom;

        // Zoom in/out
        const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
        this.zoom = Utils.clamp(this.zoom * zoomFactor, 0.1, 5);

        // Adjust pan to zoom towards mouse position
        const zoomRatio = this.zoom / prevZoom;
        const rect = this.blueprintCanvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        this.panOffset.x = mouseX - (mouseX - this.panOffset.x) * zoomRatio;
        this.panOffset.y = mouseY - (mouseY - this.panOffset.y) * zoomRatio;

        this.updateZoomDisplay();
        this.draw();
    }

    handleDoubleClick(event) {
        const point = this.getMousePosition(event);
        const found = this.findElementAtPoint(point);

        if (found && found.type === 'wall') {
            // Show add door/window context menu
            this.showWallContextMenu(found, event.clientX, event.clientY);
        }
    }

    // ==================== ELEMENT CREATION/DELETION ====================

    createElement(type, start, end) {
        const element = { start, end, type };

        if (type.startsWith('wall')) {
            this.walls.push(element);
            this.saveToHistory('add wall');
        } else if (type.startsWith('door')) {
            this.doors.push(element);
            this.saveToHistory('add door');
        } else if (type.startsWith('window')) {
            this.windows.push(element);
            this.saveToHistory('add window');
        } else if (type.startsWith('stairs')) {
            const length = Utils.geometry.distance(start, end);
            element.width = length / 2;
            element.risers = 14;
            this.stairs.push(element);
            this.saveToHistory('add stairs');
        } else if (type === 'measure') {
            this.measurements.push(element);
            this.saveToHistory('add measurement');
        }

        this.draw();
    }

    deleteElement(found) {
        const { type, index } = found;

        switch (type) {
            case 'wall':
                this.walls.splice(index, 1);
                break;
            case 'door':
                this.doors.splice(index, 1);
                break;
            case 'window':
                this.windows.splice(index, 1);
                break;
            case 'stairs':
                this.stairs.splice(index, 1);
                break;
            case 'room':
                this.rooms.splice(index, 1);
                break;
        }

        this.selectedElements = this.selectedElements.filter(e => e !== found.element);
        this.saveToHistory(`delete ${type}`);
        this.draw();
    }

    // ==================== ROOM DETECTION ====================

    detectRooms() {
        // Advanced room detection algorithm
        const rooms = [];
        const graph = this.buildWallGraph();

        // Find closed loops in the graph
        const cycles = this.findCycles(graph);

        cycles.forEach((cycle, index) => {
            const points = cycle.map(nodeKey => {
                const [x, y] = nodeKey.split(',').map(Number);
                return { x, y };
            });

            const area = Utils.geometry.polygonArea(points);
            const center = Utils.geometry.polygonCenter(points);

            // Only accept reasonably sized rooms (> 20 sq ft)
            if (area > 20 * this.scale * this.scale) {
                rooms.push({
                    id: Utils.generateId('room'),
                    name: `Room ${rooms.length + 1}`,
                    points,
                    center,
                    area: area / (this.scale * this.scale), // Convert to sq ft
                    type: 'standard',
                    height: 8,
                    includeCeiling: true
                });
            }
        });

        this.rooms = rooms;
        this.saveToHistory('detect rooms');
        this.draw();

        return rooms;
    }

    buildWallGraph() {
        const graph = {};

        this.walls.forEach(wall => {
            const startKey = `${wall.start.x},${wall.start.y}`;
            const endKey = `${wall.end.x},${wall.end.y}`;

            if (!graph[startKey]) graph[startKey] = [];
            if (!graph[endKey]) graph[endKey] = [];

            graph[startKey].push(endKey);
            graph[endKey].push(startKey);
        });

        return graph;
    }

    findCycles(graph) {
        const cycles = [];
        const visited = new Set();

        const dfs = (node, path, start) => {
            if (path.includes(node)) {
                if (node === start && path.length >= 3) {
                    const cycle = [...path];
                    // Check if this cycle is unique
                    const cycleKey = cycle.sort().join('|');
                    if (!visited.has(cycleKey)) {
                        visited.add(cycleKey);
                        cycles.push(cycle);
                    }
                }
                return;
            }

            path.push(node);

            const neighbors = graph[node] || [];
            for (const neighbor of neighbors) {
                if (path.length === 1 || neighbor !== path[path.length - 2]) {
                    dfs(neighbor, [...path], start);
                }
            }
        };

        Object.keys(graph).forEach(node => {
            dfs(node, [], node);
        });

        return cycles.slice(0, 20); // Limit to prevent performance issues
    }

    // ==================== HISTORY (UNDO/REDO) ====================

    saveToHistory(action) {
        const state = this.getState();

        // Remove any redo states
        this.history = this.history.slice(0, this.historyIndex + 1);

        // Add new state
        this.history.push({ action, state });

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }

        this.updateHistoryButtons();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex].state);
            this.updateHistoryButtons();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex].state);
            this.updateHistoryButtons();
        }
    }

    getState() {
        return {
            walls: Utils.object.clone(this.walls),
            doors: Utils.object.clone(this.doors),
            windows: Utils.object.clone(this.windows),
            stairs: Utils.object.clone(this.stairs),
            rooms: Utils.object.clone(this.rooms),
            textLabels: Utils.object.clone(this.textLabels),
            measurements: Utils.object.clone(this.measurements)
        };
    }

    restoreState(state) {
        this.walls = state.walls;
        this.doors = state.doors;
        this.windows = state.windows;
        this.stairs = state.stairs;
        this.rooms = state.rooms;
        this.textLabels = state.textLabels;
        this.measurements = state.measurements;
        this.draw();
    }

    updateHistoryButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');

        if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
        if (redoBtn) redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    // ==================== UI UPDATES ====================

    updateCursorDisplay(x, y) {
        const display = document.getElementById('cursor-position');
        if (display) {
            display.textContent = `X: ${x.toFixed(1)}', Y: ${y.toFixed(1)}'`;
        }
    }

    updateZoomDisplay() {
        const display = document.getElementById('zoom-label');
        if (display) {
            display.textContent = `Zoom: ${(this.zoom * 100).toFixed(0)}%`;
        }
    }

    updateElementCount() {
        const count = this.walls.length + this.doors.length + this.windows.length +
                      this.stairs.length + this.rooms.length;
        const display = document.getElementById('element-count');
        if (display) {
            display.textContent = `${count} element${count !== 1 ? 's' : ''}`;
        }
    }

    showWallContextMenu(wallInfo, x, y) {
        // This would trigger a context menu - implement based on your UI framework
        console.log('Context menu for wall at', x, y);
    }

    // ==================== PUBLIC API ====================

    setTool(tool) {
        this.currentTool = tool;
        this.selectedElements = [];
        this.draw();
    }

    zoomIn() {
        const center = {
            x: this.blueprintCanvas.width / 2,
            y: this.blueprintCanvas.height / 2
        };
        this.zoom = Utils.clamp(this.zoom * 1.2, 0.1, 5);
        this.updateZoomDisplay();
        this.draw();
    }

    zoomOut() {
        this.zoom = Utils.clamp(this.zoom / 1.2, 0.1, 5);
        this.updateZoomDisplay();
        this.draw();
    }

    zoomFit() {
        const allPoints = [
            ...this.walls.flatMap(w => [w.start, w.end]),
            ...this.doors.flatMap(d => [d.start, d.end]),
            ...this.windows.flatMap(w => [w.start, w.end]),
            ...this.stairs.flatMap(s => [s.start, s.end])
        ];

        if (allPoints.length === 0) {
            this.zoom = 1;
            this.panOffset = { x: 0, y: 0 };
            this.draw();
            return;
        }

        const bbox = Utils.geometry.getBoundingBox(allPoints);
        const padding = 50;

        const scaleX = (this.blueprintCanvas.width - padding * 2) / bbox.width;
        const scaleY = (this.blueprintCanvas.height - padding * 2) / bbox.height;
        this.zoom = Math.min(scaleX, scaleY, 2);

        const centerX = (bbox.minX + bbox.maxX) / 2;
        const centerY = (bbox.minY + bbox.maxY) / 2;

        this.panOffset.x = this.blueprintCanvas.width / 2 - centerX * this.zoom;
        this.panOffset.y = this.blueprintCanvas.height / 2 - centerY * this.zoom;

        this.updateZoomDisplay();
        this.draw();
    }

    resetZoom() {
        this.zoom = 1;
        this.panOffset = { x: 0, y: 0 };
        this.updateZoomDisplay();
        this.draw();
    }

    clearAll() {
        this.walls = [];
        this.doors = [];
        this.windows = [];
        this.stairs = [];
        this.rooms = [];
        this.textLabels = [];
        this.measurements = [];
        this.selectedElements = [];
        this.saveToHistory('clear all');
        this.draw();
    }

    exportData() {
        return {
            version: '1.0',
            scale: this.scale,
            gridSize: this.gridSize,
            zoom: this.zoom,
            panOffset: this.panOffset,
            walls: this.walls,
            doors: this.doors,
            windows: this.windows,
            stairs: this.stairs,
            rooms: this.rooms,
            textLabels: this.textLabels,
            measurements: this.measurements
        };
    }

    importData(data) {
        this.walls = data.walls || [];
        this.doors = data.doors || [];
        this.windows = data.windows || [];
        this.stairs = data.stairs || [];
        this.rooms = data.rooms || [];
        this.textLabels = data.textLabels || [];
        this.measurements = data.measurements || [];

        if (data.zoom) this.zoom = data.zoom;
        if (data.panOffset) this.panOffset = data.panOffset;

        this.saveToHistory('import data');
        this.draw();
    }
}

// Also export as named export for flexibility
export { BlueprintManager };
