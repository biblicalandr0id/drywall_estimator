/**
 * Main Application Controller
 * Initializes and coordinates all components of the Drywall Estimator
 */

class DrywallEstimatorApp {
    constructor() {
        this.blueprint = null;
        this.currentProject = null;
        this.currentFloor = 0;

        this.init();
    }

    init() {
        console.log('Initializing Drywall Estimator...');

        // Initialize project structure
        this.currentProject = {
            name: 'New Project',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            floors: [
                {
                    id: Utils.generateId('floor'),
                    name: 'Floor 1',
                    elevation: 0,
                    rooms: [],
                    stairs: []
                }
            ],
            pricing: this.getDefaultPricing(),
            laborRates: this.getDefaultLaborRates()
        };

        // Initialize blueprint manager
        this.blueprint = new BlueprintManager({
            grid: 'grid-canvas',
            blueprint: 'blueprint-canvas',
            overlay: 'overlay-canvas'
        });

        // Setup event listeners
        this.setupCollapsibleUI();
        this.setupViewControls();
        this.setupFloorManagement();
        this.setupLayerControls();
        this.setupTabs();
        this.setupMaterialPricing();
        this.setupCalculation();
        this.setupProjectManagement();
        this.setupKeyboardShortcuts();
        this.setupModals();

        // Initialize floor list
        this.updateFloorList();

        // Load autosaved project if available
        this.loadAutosave();

        // Start autosave interval
        this.startAutosave();

        // Update recommendations
        this.updateRecommendations();

        console.log('Drywall Estimator initialized successfully');
    }

    // ==================== TOOL MANAGEMENT ====================

    getToolName(tool) {
        const names = {
            'select': 'Select/Move',
            'wall-exterior': 'Exterior Wall',
            'wall-interior': 'Interior Wall',
            'wall-partition': 'Partition Wall',
            'door-interior': 'Interior Door',
            'door-exterior': 'Exterior Door',
            'window-standard': 'Window',
            'window-large': 'Large Window',
            'stairs-up': 'Stairs Up',
            'stairs-down': 'Stairs Down',
            'room-auto': 'Auto Detect Room',
            'measure': 'Measure',
            'text': 'Text Label',
            'erase': 'Erase'
        };
        return names[tool] || tool;
    }

    // ==================== VIEW CONTROLS ====================

    setupViewControls() {
        // Zoom controls
        document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
            this.blueprint.zoomIn();
        });

        document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
            this.blueprint.zoomOut();
        });

        document.getElementById('zoom-fit-btn')?.addEventListener('click', () => {
            this.blueprint.zoomFit();
        });

        document.getElementById('zoom-reset-btn')?.addEventListener('click', () => {
            this.blueprint.resetZoom();
        });

        // View options
        document.getElementById('show-grid')?.addEventListener('change', (e) => {
            this.blueprint.showGrid = e.target.checked;
            this.blueprint.draw();
        });

        document.getElementById('show-dimensions')?.addEventListener('change', (e) => {
            this.blueprint.showDimensions = e.target.checked;
            this.blueprint.draw();
        });

        document.getElementById('snap-to-grid')?.addEventListener('change', (e) => {
            this.blueprint.snapToGrid = e.target.checked;
        });

        document.getElementById('show-room-labels')?.addEventListener('change', (e) => {
            this.blueprint.showRoomLabels = e.target.checked;
            this.blueprint.draw();
        });
    }

    // ==================== FLOOR MANAGEMENT ====================

    setupFloorManagement() {
        document.getElementById('add-floor-btn')?.addEventListener('click', () => {
            this.addFloor();
        });
    }

    addFloor() {
        const floorNumber = this.currentProject.floors.length + 1;
        const newFloor = {
            id: Utils.generateId('floor'),
            name: `Floor ${floorNumber}`,
            elevation: (floorNumber - 1) * 10, // 10 ft per floor
            rooms: [],
            stairs: []
        };

        this.currentProject.floors.push(newFloor);
        this.updateFloorList();
        this.switchFloor(this.currentProject.floors.length - 1);
    }

    switchFloor(index) {
        if (index < 0 || index >= this.currentProject.floors.length) return;

        // Save current floor data
        this.saveCurrentFloorData();

        // Switch to new floor
        this.currentFloor = index;

        // Load new floor data
        this.loadCurrentFloorData();

        // Update UI
        this.updateFloorList();
        this.updateCurrentFloorLabel();
    }

    saveCurrentFloorData() {
        const floor = this.currentProject.floors[this.currentFloor];
        const data = this.blueprint.exportData();

        floor.walls = data.walls;
        floor.doors = data.doors;
        floor.windows = data.windows;
        floor.stairs = data.stairs;
        floor.rooms = data.rooms;
    }

    loadCurrentFloorData() {
        const floor = this.currentProject.floors[this.currentFloor];

        this.blueprint.importData({
            walls: floor.walls || [],
            doors: floor.doors || [],
            windows: floor.windows || [],
            stairs: floor.stairs || [],
            rooms: floor.rooms || []
        });
    }

    updateFloorList() {
        const container = document.getElementById('floor-list');
        if (!container) return;

        container.innerHTML = '';

        this.currentProject.floors.forEach((floor, index) => {
            const floorItem = Utils.dom.createElement('div', 'floor-item');
            if (index === this.currentFloor) {
                floorItem.classList.add('active');
            }

            floorItem.innerHTML = `
                <span class="floor-item-name">${floor.name}</span>
                <div class="floor-item-actions">
                    <button class="btn btn-sm" data-action="rename" data-index="${index}" title="Rename">✏️</button>
                    ${this.currentProject.floors.length > 1 ? `<button class="btn btn-sm btn-danger" data-action="delete" data-index="${index}" title="Delete">✕</button>` : ''}
                </div>
            `;

            floorItem.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    this.switchFloor(index);
                }
            });

            // Button event listeners
            floorItem.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    const idx = parseInt(btn.dataset.index);

                    if (action === 'rename') {
                        this.renameFloor(idx);
                    } else if (action === 'delete') {
                        this.deleteFloor(idx);
                    }
                });
            });

            container.appendChild(floorItem);
        });
    }

    renameFloor(index) {
        const floor = this.currentProject.floors[index];
        const newName = prompt('Enter new floor name:', floor.name);
        if (newName && newName.trim()) {
            floor.name = newName.trim();
            this.updateFloorList();
            this.updateCurrentFloorLabel();
        }
    }

    deleteFloor(index) {
        if (this.currentProject.floors.length <= 1) {
            alert('Cannot delete the last floor.');
            return;
        }

        if (confirm(`Are you sure you want to delete ${this.currentProject.floors[index].name}?`)) {
            this.currentProject.floors.splice(index, 1);

            if (this.currentFloor >= this.currentProject.floors.length) {
                this.currentFloor = this.currentProject.floors.length - 1;
            }

            this.updateFloorList();
            this.loadCurrentFloorData();
        }
    }

    updateCurrentFloorLabel() {
        const label = document.getElementById('current-floor-label');
        if (label) {
            label.textContent = this.currentProject.floors[this.currentFloor].name;
        }
    }

    // ==================== LAYER CONTROLS ====================

    setupLayerControls() {
        const layerCheckboxes = {
            'layer-walls': 'walls',
            'layer-doors': 'doors',
            'layer-windows': 'windows',
            'layer-stairs': 'stairs',
            'layer-rooms': 'rooms'
        };

        Object.entries(layerCheckboxes).forEach(([id, layer]) => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.blueprint.layers[layer] = e.target.checked;
                    this.blueprint.draw();
                });
            }
        });
    }

    // ==================== TABS ====================

    setupTabs() {
        // Ribbon tab switching
        const ribbonTabs = document.querySelectorAll('.ribbon-tab');
        ribbonTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const ribbonId = tab.dataset.ribbon;

                // Remove active from all tabs and ribbons
                ribbonTabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.ribbon').forEach(r => r.classList.remove('active'));

                // Activate clicked tab and corresponding ribbon
                tab.classList.add('active');
                document.getElementById(`${ribbonId}-ribbon`)?.classList.add('active');
            });
        });

        // Side panel tab switching
        const panelTabs = document.querySelectorAll('.panel-tab');
        panelTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const panelId = tab.dataset.panelTab;

                // Remove active from all panel tabs
                panelTabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.panel-tab-content').forEach(c => c.classList.remove('active'));

                // Activate clicked tab and content
                tab.classList.add('active');
                document.getElementById(`${panelId}-panel-content`)?.classList.add('active');
            });
        });
    }

    // ==================== MATERIAL PRICING ====================

    setupMaterialPricing() {
        // Price preset selection
        document.getElementById('price-preset-select')?.addEventListener('change', (e) => {
            if (e.target.value !== 'custom') {
                this.applyPricePreset(e.target.value);
            }
        });

        // All price inputs trigger recalculation
        const priceInputs = document.querySelectorAll('[id^="price-"], [id^="labor-"]');
        priceInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateProjectPricing();
            });
        });
    }

    getDefaultPricing() {
        return {
            drywallStandard: 15.00,
            drywallFirerated: 18.00,
            drywallMoisture: 22.50,
            drywallTypex: 20.00,
            mud: 20.00,
            tapePaper: 8.00,
            tapeMesh: 12.00,
            screws: 8.00,
            cornerBeadMetal: 5.00,
            cornerBeadBullnose: 7.50,
            primer: 35.00,
            texture: 15.00
        };
    }

    getDefaultLaborRates() {
        return {
            hanging: 0.80,
            taping: 0.90,
            finishing: 0.80
        };
    }

    applyPricePreset(preset) {
        const presets = {
            'national-standard': {
                drywallStandard: 15.00, drywallFirerated: 18.00, drywallMoisture: 22.50,
                mud: 20.00, tapePaper: 8.00, screws: 8.00, cornerBeadMetal: 5.00,
                primer: 35.00, hanging: 0.80, taping: 0.90, finishing: 0.80
            },
            'national-premium': {
                drywallStandard: 19.00, drywallFirerated: 23.00, drywallMoisture: 28.00,
                mud: 28.00, tapePaper: 12.00, screws: 10.00, cornerBeadMetal: 7.00,
                primer: 45.00, hanging: 1.20, taping: 1.30, finishing: 1.20
            },
            'northeast-standard': {
                drywallStandard: 16.50, drywallFirerated: 20.00, drywallMoisture: 24.50,
                mud: 22.00, tapePaper: 9.00, screws: 9.00, cornerBeadMetal: 5.50,
                primer: 38.00, hanging: 1.00, taping: 1.10, finishing: 1.00
            }
            // Add more presets as needed
        };

        const prices = presets[preset];
        if (!prices) return;

        // Update UI
        document.getElementById('price-drywall-standard').value = prices.drywallStandard;
        document.getElementById('price-drywall-firerated').value = prices.drywallFirerated || prices.drywallStandard * 1.2;
        document.getElementById('price-drywall-moisture').value = prices.drywallMoisture;
        document.getElementById('price-mud').value = prices.mud;
        document.getElementById('price-tape-paper').value = prices.tapePaper;
        document.getElementById('price-screws').value = prices.screws;
        document.getElementById('price-cornerbead-metal').value = prices.cornerBeadMetal;
        document.getElementById('price-primer').value = prices.primer;
        document.getElementById('labor-hanging').value = prices.hanging;
        document.getElementById('labor-taping').value = prices.taping;
        document.getElementById('labor-finishing').value = prices.finishing;

        this.updateProjectPricing();
        this.setStatus(`Applied ${preset} pricing`);
    }

    updateProjectPricing() {
        this.currentProject.pricing = {
            drywallStandard: parseFloat(document.getElementById('price-drywall-standard')?.value || 15),
            drywallFirerated: parseFloat(document.getElementById('price-drywall-firerated')?.value || 18),
            drywallMoisture: parseFloat(document.getElementById('price-drywall-moisture')?.value || 22.5),
            drywallTypex: parseFloat(document.getElementById('price-drywall-typex')?.value || 20),
            mud: parseFloat(document.getElementById('price-mud')?.value || 20),
            tapePaper: parseFloat(document.getElementById('price-tape-paper')?.value || 8),
            tapeMesh: parseFloat(document.getElementById('price-tape-mesh')?.value || 12),
            screws: parseFloat(document.getElementById('price-screws')?.value || 8),
            cornerBeadMetal: parseFloat(document.getElementById('price-cornerbead-metal')?.value || 5),
            cornerBeadBullnose: parseFloat(document.getElementById('price-cornerbead-bullnose')?.value || 7.5),
            primer: parseFloat(document.getElementById('price-primer')?.value || 35),
            texture: parseFloat(document.getElementById('price-texture')?.value || 15)
        };

        this.currentProject.laborRates = {
            hanging: parseFloat(document.getElementById('labor-hanging')?.value || 0.80),
            taping: parseFloat(document.getElementById('labor-taping')?.value || 0.90),
            finishing: parseFloat(document.getElementById('labor-finishing')?.value || 0.80)
        };
    }

    // ==================== CALCULATION ====================

    setupCalculation() {
        document.getElementById('calculate-estimate-btn')?.addEventListener('click', () => {
            this.calculateEstimate();
        });

        document.getElementById('detect-rooms-btn')?.addEventListener('click', () => {
            this.detectRooms();
        });

        document.getElementById('add-room-manual-btn')?.addEventListener('click', () => {
            this.showRoomModal();
        });
    }

    calculateEstimate() {
        this.setStatus('Calculating estimate...');

        // Save current floor data
        this.saveCurrentFloorData();

        // Update pricing
        this.updateProjectPricing();

        // Get options
        const wasteFactor = parseFloat(document.getElementById('waste-factor')?.value || 10) / 100;
        const markup = parseFloat(document.getElementById('markup-percent')?.value || 20) / 100;

        // Calculate
        const estimate = DrywallCalculator.calculateProjectEstimate(
            this.currentProject,
            {
                drywallPerSheet: this.currentProject.pricing.drywallStandard,
                mudPerBucket: this.currentProject.pricing.mud,
                tapePerRoll: this.currentProject.pricing.tapePaper,
                screwsPerPound: this.currentProject.pricing.screws,
                cornerBeadPer10ft: this.currentProject.pricing.cornerBeadMetal,
                primerPerGallon: this.currentProject.pricing.primer,
                texturePerBag: this.currentProject.pricing.texture
            },
            this.currentProject.laborRates,
            {
                wasteFactor,
                markup,
                includePrimer: true,
                includeTexture: false,
                finishLevel: 'level4'
            }
        );

        // Display results
        this.displayEstimate(estimate);

        // Update recommendations
        this.updateRecommendations(estimate);

        this.setStatus('Estimate calculated');
    }

    displayEstimate(estimate) {
        // Areas
        document.getElementById('est-wall-area').textContent = Utils.units.formatArea(estimate.areas.wall);
        document.getElementById('est-ceiling-area').textContent = Utils.units.formatArea(estimate.areas.ceiling);
        document.getElementById('est-stair-area').textContent = Utils.units.formatArea(estimate.areas.stairs);
        document.getElementById('est-total-area').textContent = Utils.units.formatArea(estimate.areas.total);

        // Materials breakdown
        const materialsContainer = document.getElementById('materials-breakdown');
        if (materialsContainer) {
            const materialList = DrywallCalculator.generateMaterialList(estimate);

            materialsContainer.innerHTML = materialList.map(item => `
                <div class="material-item">
                    <div>
                        <div class="material-name">${item.item}</div>
                        <div class="material-quantity">${item.quantity} ${item.unit}</div>
                    </div>
                    <div class="material-cost">${Utils.units.formatCurrency(item.totalCost)}</div>
                </div>
            `).join('');
        }

        // Costs
        document.getElementById('est-materials-cost').textContent = Utils.units.formatCurrency(estimate.costs.materials.total);
        document.getElementById('est-labor-cost').textContent = Utils.units.formatCurrency(estimate.costs.labor.total);
        document.getElementById('est-subtotal').textContent = Utils.units.formatCurrency(estimate.costs.subtotal);
        document.getElementById('est-markup').textContent = Utils.units.formatCurrency(estimate.costs.markup);
        document.getElementById('est-total').textContent = Utils.units.formatCurrency(estimate.costs.total);

        // Save estimate to project
        this.currentProject.lastEstimate = estimate;
    }

    detectRooms() {
        const rooms = this.blueprint.detectRooms();

        if (rooms.length === 0) {
            alert('No rooms detected. Try drawing more complete room outlines.');
            return;
        }

        // Save to current floor
        this.currentProject.floors[this.currentFloor].rooms = rooms;

        // Update room list
        this.updateRoomsList();

        this.setStatus(`Detected ${rooms.length} room${rooms.length !== 1 ? 's' : ''}`);
    }

    updateRoomsList() {
        const container = document.getElementById('rooms-list');
        if (!container) return;

        const rooms = this.currentProject.floors[this.currentFloor].rooms;

        if (rooms.length === 0) {
            container.innerHTML = '<p style="padding: 1rem; text-align: center; color: #6b7280;">No rooms yet. Draw walls and use Auto-Detect.</p>';
            return;
        }

        container.innerHTML = rooms.map((room, index) => `
            <div class="room-item" data-room-id="${room.id}">
                <div class="room-item-header">
                    <div class="room-item-name">${room.name}</div>
                    <div class="room-item-type">${room.type || 'Standard'}</div>
                </div>
                <div class="room-item-stats">
                    <div class="room-item-stat">
                        <div class="room-item-stat-label">Area</div>
                        <div class="room-item-stat-value">${room.area ? room.area.toFixed(0) : '0'} sq ft</div>
                    </div>
                    <div class="room-item-stat">
                        <div class="room-item-stat-label">Height</div>
                        <div class="room-item-stat-value">${room.height || 8}'</div>
                    </div>
                </div>
                <div class="room-item-actions">
                    <button class="btn btn-sm" onclick="app.editRoom(${index})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteRoom(${index})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    showRoomModal(roomIndex = null) {
        const modal = document.getElementById('room-modal');
        if (!modal) return;

        modal.classList.add('active');

        // If editing existing room, populate fields
        if (roomIndex !== null) {
            const room = this.currentProject.floors[this.currentFloor].rooms[roomIndex];
            document.getElementById('room-name').value = room.name;
            document.getElementById('room-type').value = room.type || 'living';
            document.getElementById('room-width').value = room.width || 12;
            document.getElementById('room-length').value = room.length || 15;
            document.getElementById('room-height').value = room.height || 8;
            document.getElementById('room-ceiling-type').value = room.ceilingType || 'standard';
            document.getElementById('room-drywall-type').value = room.drywallType || 'standard';
            document.getElementById('room-finish-level').value = room.finishLevel || 'level4';
            document.getElementById('room-include-ceiling').checked = room.includeCeiling !== false;
            document.getElementById('room-include-texture').checked = room.includeTexture || false;
            document.getElementById('room-include-primer').checked = room.includePrimer !== false;
        }
    }

    editRoom(index) {
        this.showRoomModal(index);
    }

    deleteRoom(index) {
        if (confirm('Are you sure you want to delete this room?')) {
            this.currentProject.floors[this.currentFloor].rooms.splice(index, 1);
            this.updateRoomsList();
        }
    }

    // ==================== PROJECT MANAGEMENT ====================

    setupProjectManagement() {
        document.getElementById('new-project-btn')?.addEventListener('click', () => {
            this.newProject();
        });

        document.getElementById('save-project-btn')?.addEventListener('click', () => {
            this.saveProject();
        });

        document.getElementById('load-project-btn')?.addEventListener('click', () => {
            this.loadProject();
        });

        document.getElementById('export-estimate-btn')?.addEventListener('click', () => {
            this.exportEstimate();
        });

        document.getElementById('print-estimate-btn')?.addEventListener('click', () => {
            this.printEstimate();
        });

        // Quick actions
        document.getElementById('undo-btn')?.addEventListener('click', () => {
            this.blueprint.undo();
        });

        document.getElementById('redo-btn')?.addEventListener('click', () => {
            this.blueprint.redo();
        });

        document.getElementById('clear-all-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all elements on this floor?')) {
                this.blueprint.clearAll();
            }
        });
    }

    newProject() {
        if (confirm('Start a new project? Any unsaved changes will be lost.')) {
            this.currentProject = {
                name: 'New Project',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                floors: [{
                    id: Utils.generateId('floor'),
                    name: 'Floor 1',
                    elevation: 0,
                    rooms: [],
                    stairs: []
                }],
                pricing: this.getDefaultPricing(),
                laborRates: this.getDefaultLaborRates()
            };

            this.currentFloor = 0;
            this.blueprint.clearAll();
            this.updateFloorList();
            this.updateCurrentFloorLabel();
            this.setStatus('New project created');
        }
    }

    saveProject() {
        this.saveCurrentFloorData();
        this.currentProject.modified = new Date().toISOString();

        const filename = Utils.file.generateFilename(
            this.currentProject.name.replace(/[^a-z0-9]/gi, '_'),
            'json'
        );

        Utils.file.downloadJSON(this.currentProject, filename);
        this.setStatus('Project saved');
    }

    loadProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await Utils.file.readFileAsText(file);
                const data = JSON.parse(text);

                this.currentProject = data;
                this.currentFloor = 0;
                this.updateFloorList();
                this.loadCurrentFloorData();
                this.setStatus('Project loaded');
            } catch (error) {
                alert('Error loading project: ' + error.message);
            }
        };

        input.click();
    }

    exportEstimate() {
        if (!this.currentProject.lastEstimate) {
            alert('Please calculate an estimate first.');
            return;
        }

        const filename = Utils.file.generateFilename('estimate', 'json');
        Utils.file.downloadJSON(this.currentProject.lastEstimate, filename);
    }

    printEstimate() {
        if (!this.currentProject.lastEstimate) {
            alert('Please calculate an estimate first.');
            return;
        }

        // Create print window with formatted estimate
        const printWindow = window.open('', '_blank');
        const estimate = this.currentProject.lastEstimate;
        const materialList = DrywallCalculator.generateMaterialList(estimate);

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Drywall Estimate - ${this.currentProject.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
                    .header-info { margin: 20px 0; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background-color: #f3f4f6; font-weight: 600; }
                    .total-row { font-weight: bold; font-size: 1.2em; background-color: #dbeafe; }
                    .section { margin: 30px 0; }
                    @media print { button { display: none; } }
                </style>
            </head>
            <body>
                <h1>Drywall Estimate</h1>
                <div class="header-info">
                    <p><strong>Project:</strong> ${this.currentProject.name}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>Prepared by:</strong> Professional Drywall Estimator</p>
                </div>

                <div class="section">
                    <h2>Areas</h2>
                    <table>
                        <tr><td>Wall Area:</td><td>${Utils.units.formatArea(estimate.areas.wall)}</td></tr>
                        <tr><td>Ceiling Area:</td><td>${Utils.units.formatArea(estimate.areas.ceiling)}</td></tr>
                        <tr><td>Stairwell Area:</td><td>${Utils.units.formatArea(estimate.areas.stairs)}</td></tr>
                        <tr class="total-row"><td>Total Area:</td><td>${Utils.units.formatArea(estimate.areas.total)}</td></tr>
                    </table>
                </div>

                <div class="section">
                    <h2>Materials</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${materialList.map(item => `
                                <tr>
                                    <td>${item.item}</td>
                                    <td>${item.quantity} ${item.unit}</td>
                                    <td>${Utils.units.formatCurrency(item.unitCost)}</td>
                                    <td>${Utils.units.formatCurrency(item.totalCost)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h2>Cost Summary</h2>
                    <table>
                        <tr><td>Materials:</td><td>${Utils.units.formatCurrency(estimate.costs.materials.total)}</td></tr>
                        <tr><td>Labor:</td><td>${Utils.units.formatCurrency(estimate.costs.labor.total)}</td></tr>
                        <tr><td>Subtotal:</td><td>${Utils.units.formatCurrency(estimate.costs.subtotal)}</td></tr>
                        <tr><td>Markup:</td><td>${Utils.units.formatCurrency(estimate.costs.markup)}</td></tr>
                        <tr class="total-row"><td>Total Estimate:</td><td>${Utils.units.formatCurrency(estimate.costs.total)}</td></tr>
                    </table>
                </div>

                <button onclick="window.print()">Print</button>
            </body>
            </html>
        `);

        printWindow.document.close();
    }

    // ==================== RECOMMENDATIONS ====================

    updateRecommendations(estimate = null) {
        const recommendations = RecommendationEngine.generateRecommendations(
            this.currentProject,
            estimate
        );

        const container = document.getElementById('recommendations-list');
        if (!container) return;

        if (recommendations.length === 0) {
            container.innerHTML = `
                <div class="recommendation-card info">
                    <div class="recommendation-icon">✓</div>
                    <div class="recommendation-content">
                        <strong>Looking good!</strong>
                        <p>No issues or recommendations at this time.</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = recommendations.map(rec => `
            <div class="recommendation-card ${rec.type || 'info'}">
                <div class="recommendation-icon">${this.getRecommendationIcon(rec.type)}</div>
                <div class="recommendation-content">
                    <strong>${rec.title}</strong>
                    <p>${rec.message}</p>
                    ${rec.savings ? `<p style="color: #059669; font-weight: 600;">Potential savings: ${Utils.units.formatCurrency(rec.savings)}</p>` : ''}
                    ${rec.code ? `<p style="font-size: 0.75rem; color: #6b7280;">Code: ${rec.code}</p>` : ''}
                </div>
            </div>
        `).join('');
    }

    getRecommendationIcon(type) {
        const icons = {
            'success': '✓',
            'info': '💡',
            'warning': '⚠️',
            'danger': '❌'
        };
        return icons[type] || '💡';
    }

    // ==================== MODALS ====================

    setupModals() {
        // Close modal buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('active');
            });
        });

        // Click outside to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Help modal
        document.getElementById('help-btn')?.addEventListener('click', () => {
            document.getElementById('help-modal')?.classList.add('active');
        });

        // Room modal save button
        document.getElementById('room-save-btn')?.addEventListener('click', () => {
            this.saveRoomFromModal();
        });

        document.getElementById('room-cancel-btn')?.addEventListener('click', () => {
            document.getElementById('room-modal')?.classList.remove('active');
        });
    }

    saveRoomFromModal() {
        const room = {
            id: Utils.generateId('room'),
            name: document.getElementById('room-name').value,
            type: document.getElementById('room-type').value,
            width: parseFloat(document.getElementById('room-width').value),
            length: parseFloat(document.getElementById('room-length').value),
            height: parseFloat(document.getElementById('room-height').value),
            ceilingType: document.getElementById('room-ceiling-type').value,
            drywallType: document.getElementById('room-drywall-type').value,
            finishLevel: document.getElementById('room-finish-level').value,
            includeCeiling: document.getElementById('room-include-ceiling').checked,
            includeTexture: document.getElementById('room-include-texture').checked,
            includePrimer: document.getElementById('room-include-primer').checked
        };

        this.currentProject.floors[this.currentFloor].rooms.push(room);
        this.updateRoomsList();

        document.getElementById('room-modal')?.classList.remove('active');
    }

    // ==================== KEYBOARD SHORTCUTS ====================

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Tool shortcuts
            const toolShortcuts = {
                'v': 'select',
                'w': 'wall-exterior',
                'i': 'wall-interior',
                'p': 'wall-partition',
                'd': 'door-interior',
                'e': 'door-exterior',
                'n': 'window-standard',
                'u': 'stairs-up',
                'm': 'measure',
                't': 'text'
            };

            const tool = toolShortcuts[e.key.toLowerCase()];
            if (tool) {
                const btn = document.querySelector(`.tool-btn[data-tool="${tool}"]`);
                if (btn) btn.click();
                return;
            }

            // View shortcuts
            if (e.key === '+' || e.key === '=') {
                this.blueprint.zoomIn();
            } else if (e.key === '-') {
                this.blueprint.zoomOut();
            } else if (e.key === '0') {
                this.blueprint.zoomFit();
            }

            // Undo/Redo
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    this.blueprint.undo();
                } else if (e.key === 'y') {
                    e.preventDefault();
                    this.blueprint.redo();
                } else if (e.key === 's') {
                    e.preventDefault();
                    this.saveProject();
                }
            }

            // Delete
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.blueprint.selectedElements.length > 0) {
                    e.preventDefault();
                    // Delete selected elements
                }
            }
        });
    }

    // ==================== AUTOSAVE ====================

    startAutosave() {
        setInterval(() => {
            this.autosave();
        }, 60000); // Every minute
    }

    autosave() {
        this.saveCurrentFloorData();
        Utils.storage.save('drywall_autosave', this.currentProject);
    }

    loadAutosave() {
        const saved = Utils.storage.load('drywall_autosave');
        if (saved && saved.modified) {
            const lastModified = new Date(saved.modified);
            const now = new Date();
            const hoursSince = (now - lastModified) / (1000 * 60 * 60);

            if (hoursSince < 24) {
                if (confirm(`Found autosaved project from ${lastModified.toLocaleString()}. Load it?`)) {
                    this.currentProject = saved;
                    this.loadCurrentFloorData();
                    this.updateFloorList();
                }
            }
        }
    }

    // ==================== UTILITY ====================

    setStatus(message) {
        const statusElement = document.getElementById('status-message');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    // ==================== RIBBON UI ====================

    setupCollapsibleUI() {
        // Side panel toggle
        const sidePanel = document.getElementById('side-panel');
        const panelToggle = document.getElementById('panel-toggle');

        panelToggle?.addEventListener('click', () => {
            sidePanel?.classList.toggle('collapsed');
            const icon = panelToggle.querySelector('.toggle-icon');
            if (sidePanel?.classList.contains('collapsed')) {
                icon.textContent = '◀';
            } else {
                icon.textContent = '▶';
            }
            // Trigger resize on blueprint
            setTimeout(() => this.blueprint?.resize(), 300);
        });

        // Tool buttons across all ribbons (handled by data-tool attribute)
        const toolButtons = document.querySelectorAll('[data-tool]');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active from all tool buttons
                toolButtons.forEach(b => b.classList.remove('active'));

                // Add active to clicked button
                btn.classList.add('active');

                // Set tool in blueprint
                const tool = btn.dataset.tool;
                if (this.blueprint) {
                    this.blueprint.setTool(tool);
                    this.setStatus(`Tool: ${this.getToolName(tool)}`);
                }
            });
        });

        // Toggle buttons (layers, display options, snap, etc.)
        this.setupToggleButtons();
    }

    setupToggleButtons() {
        const toggleButtons = document.querySelectorAll('.icon-btn.toggle');
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');

                // Handle specific toggles
                const id = btn.id;
                if (id === 'snap-to-grid' && this.blueprint) {
                    this.blueprint.snapToGrid = btn.classList.contains('active');
                } else if (id === 'show-grid' && this.blueprint) {
                    this.blueprint.layers.grid = btn.classList.contains('active');
                    this.blueprint.draw();
                } else if (id === 'show-dimensions' && this.blueprint) {
                    this.blueprint.layers.dimensions = btn.classList.contains('active');
                    this.blueprint.draw();
                } else if (id === 'show-room-labels' && this.blueprint) {
                    this.blueprint.layers.roomLabels = btn.classList.contains('active');
                    this.blueprint.draw();
                } else if (id.startsWith('layer-')) {
                    const layer = id.replace('layer-', '');
                    if (this.blueprint && this.blueprint.layers[layer] !== undefined) {
                        this.blueprint.layers[layer] = btn.classList.contains('active');
                        this.blueprint.draw();
                    }
                } else if (id === 'quick-include-ceiling') {
                    // Handle quick ceiling toggle
                } else if (id === 'quick-include-texture') {
                    // Handle quick texture toggle
                } else if (id === 'quick-include-primer') {
                    // Handle quick primer toggle
                }
            });
        });
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DrywallEstimatorApp();
});
