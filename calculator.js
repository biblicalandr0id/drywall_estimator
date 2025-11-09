/**
 * Advanced Drywall Calculator
 * Handles all material calculations including walls, ceilings, stairs, and multi-floor support
 */

const DrywallCalculator = {
    // Constants
    STANDARD_SHEET_SIZE: { width: 4, height: 8, area: 32 }, // feet
    STANDARD_DOOR_SIZE: { width: 3, height: 7, area: 21 }, // feet
    STANDARD_INTERIOR_DOOR: { width: 2.67, height: 6.67, area: 17.8 }, // 32" x 80"
    STANDARD_EXTERIOR_DOOR: { width: 3, height: 6.67, area: 20 }, // 36" x 80"
    STANDARD_WINDOW: { width: 3, height: 4, area: 12 }, // feet
    LARGE_WINDOW: { width: 5, height: 4, area: 20 }, // feet

    // Wall thicknesses (inches)
    WALL_THICKNESS: {
        exterior: 6, // 2x6 framing
        interior: 4.5, // 2x4 framing
        partition: 3.5 // 2x3 framing
    },

    // Material coverage rates
    COVERAGE: {
        primer: 300, // sq ft per gallon
        texture: 500, // sq ft per bag
        mud_per_sheet: 8, // sheets per bucket
        tape_per_roll: 75, // linear feet per roll
        screws_per_pound: 200, // screws per pound
        screws_per_sheet: 30, // screws needed per sheet
        tape_per_sheet: 6 // linear feet of tape per sheet
    },

    /**
     * Calculate total wall area for a room
     */
    calculateWallArea(room) {
        const { width, length, height, doors = 0, windows = 0 } = room;
        const perimeter = 2 * (width + length);
        const grossArea = perimeter * height;

        // Calculate door openings
        let doorArea = 0;
        if (room.doorDetails) {
            doorArea = room.doorDetails.reduce((sum, door) => {
                return sum + (door.width || 3) * (door.height || 7);
            }, 0);
        } else {
            doorArea = doors * this.STANDARD_DOOR_SIZE.area;
        }

        // Calculate window openings
        let windowArea = 0;
        if (room.windowDetails) {
            windowArea = room.windowDetails.reduce((sum, window) => {
                return sum + (window.width || 3) * (window.height || 4);
            }, 0);
        } else {
            windowArea = windows * this.STANDARD_WINDOW.area;
        }

        return {
            gross: grossArea,
            openings: doorArea + windowArea,
            net: grossArea - doorArea - windowArea,
            perimeter: perimeter
        };
    },

    /**
     * Calculate ceiling area
     */
    calculateCeilingArea(room) {
        const { width, length, ceilingType = 'standard' } = room;
        const baseArea = width * length;

        // Adjust for ceiling type
        let multiplier = 1;
        switch (ceilingType) {
            case 'vaulted':
                multiplier = 1.4; // Approximate 40% more surface area
                break;
            case 'tray':
                multiplier = 1.2; // Approximate 20% more surface area
                break;
            case 'coffered':
                multiplier = 1.3; // Approximate 30% more surface area
                break;
            case 'none':
                return 0;
        }

        return baseArea * multiplier;
    },

    /**
     * Calculate stairwell drywall area
     */
    calculateStairwellArea(stairs) {
        const {
            risers = 14,
            treadWidth = 36,
            riserHeight = 7.5,
            width = 4,
            length = 12,
            wallsBothSides = true,
            underCeiling = true
        } = stairs;

        // Convert inches to feet
        const treadWidthFt = treadWidth / 12;
        const riserHeightFt = riserHeight / 12;

        // Calculate stringer length (hypotenuse)
        const totalRise = risers * riserHeightFt;
        const totalRun = (risers - 1) * (treadWidthFt);
        const stringerLength = Math.sqrt(totalRise * totalRise + totalRun * totalRun);

        // Calculate wall area along stairs
        let wallArea = stringerLength * width; // One side
        if (wallsBothSides) {
            wallArea *= 2; // Both sides
        }

        // Add ceiling under stairs if applicable
        let ceilingArea = 0;
        if (underCeiling) {
            ceilingArea = stringerLength * width;
        }

        // Add stairwell walls (vertical portions)
        const stairwellWallArea = 2 * (length * totalRise); // Front and back walls

        return {
            walls: wallArea,
            ceiling: ceilingArea,
            stairwellWalls: stairwellWallArea,
            total: wallArea + ceilingArea + stairwellWallArea,
            angle: Math.atan2(totalRise, totalRun) * 180 / Math.PI
        };
    },

    /**
     * Calculate total drywall sheets needed
     */
    calculateSheets(totalArea, wasteFactor = 0.10) {
        const areaWithWaste = totalArea * (1 + wasteFactor);
        return Math.ceil(areaWithWaste / this.STANDARD_SHEET_SIZE.area);
    },

    /**
     * Calculate joint compound needed
     */
    calculateJointCompound(sheets, finishLevel = 'level4') {
        // Finish level multipliers
        const multipliers = {
            level0: 0,
            level1: 0.5,
            level2: 0.75,
            level3: 1.0,
            level4: 1.25,
            level5: 1.5
        };

        const multiplier = multipliers[finishLevel] || 1.25;
        const bucketsNeeded = (sheets / this.COVERAGE.mud_per_sheet) * multiplier;
        return Math.ceil(bucketsNeeded);
    },

    /**
     * Calculate tape needed
     */
    calculateTape(sheets, tapeType = 'paper') {
        const linearFeet = sheets * this.COVERAGE.tape_per_sheet;
        const rolls = Math.ceil(linearFeet / this.COVERAGE.tape_per_roll);

        // Mesh tape typically requires less
        if (tapeType === 'mesh') {
            return Math.ceil(rolls * 0.8);
        }

        return rolls;
    },

    /**
     * Calculate screws needed
     */
    calculateScrews(sheets) {
        const totalScrews = sheets * this.COVERAGE.screws_per_sheet;
        return Math.ceil(totalScrews / this.COVERAGE.screws_per_pound);
    },

    /**
     * Calculate corner bead needed
     */
    calculateCornerBead(rooms, cornerType = 'metal') {
        let totalCorners = 0;
        let totalHeight = 0;

        rooms.forEach(room => {
            // Standard rooms have 4 vertical corners
            const corners = room.corners || 4;
            totalCorners += corners;
            totalHeight += room.height;
        });

        // Calculate linear feet of corner bead
        const avgHeight = rooms.length > 0 ? totalHeight / rooms.length : 8;
        const linearFeet = totalCorners * avgHeight;

        // Corner bead typically comes in 10-foot lengths
        const units = Math.ceil(linearFeet / 10);

        // Bullnose corners typically require 1.2x more
        if (cornerType === 'bullnose') {
            return Math.ceil(units * 1.2);
        }

        return units;
    },

    /**
     * Calculate primer needed
     */
    calculatePrimer(totalArea) {
        const gallons = totalArea / this.COVERAGE.primer;
        return Math.ceil(gallons);
    },

    /**
     * Calculate texture material needed
     */
    calculateTexture(totalArea) {
        const bags = totalArea / this.COVERAGE.texture;
        return Math.ceil(bags);
    },

    /**
     * Calculate material costs
     */
    calculateMaterialCosts(materials, pricing) {
        const costs = {
            drywall: materials.sheets * pricing.drywallPerSheet,
            mud: materials.mud * pricing.mudPerBucket,
            tape: materials.tape * pricing.tapePerRoll,
            screws: materials.screws * pricing.screwsPerPound,
            cornerBead: materials.cornerBead * pricing.cornerBeadPer10ft,
            primer: materials.primer * pricing.primerPerGallon,
            texture: materials.texture * pricing.texturePerBag
        };

        costs.total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
        return costs;
    },

    /**
     * Calculate labor costs
     */
    calculateLaborCosts(totalArea, laborRates) {
        const costs = {
            hanging: totalArea * laborRates.hanging,
            taping: totalArea * laborRates.taping,
            finishing: totalArea * laborRates.finishing
        };

        costs.total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
        return costs;
    },

    /**
     * Comprehensive estimate for entire project
     */
    calculateProjectEstimate(project, pricing, laborRates, options = {}) {
        const {
            wasteFactor = 0.10,
            finishLevel = 'level4',
            includePrimer = true,
            includeTexture = false,
            tapeType = 'paper',
            cornerType = 'metal',
            markup = 0.20
        } = options;

        // Initialize totals
        let totalWallArea = 0;
        let totalCeilingArea = 0;
        let totalStairArea = 0;
        const rooms = [];

        // Calculate areas for each floor
        project.floors.forEach(floor => {
            floor.rooms.forEach(room => {
                const wallArea = this.calculateWallArea(room);
                const ceilingArea = room.includeCeiling ? this.calculateCeilingArea(room) : 0;

                totalWallArea += wallArea.net;
                totalCeilingArea += ceilingArea;

                rooms.push({
                    name: room.name,
                    wallArea: wallArea.net,
                    ceilingArea: ceilingArea,
                    type: room.type
                });
            });

            // Add stairwells
            if (floor.stairs) {
                floor.stairs.forEach(stair => {
                    const stairArea = this.calculateStairwellArea(stair);
                    totalStairArea += stairArea.total;
                });
            }
        });

        const totalArea = totalWallArea + totalCeilingArea + totalStairArea;

        // Calculate materials
        const sheets = this.calculateSheets(totalArea, wasteFactor);
        const mud = this.calculateJointCompound(sheets, finishLevel);
        const tape = this.calculateTape(sheets, tapeType);
        const screws = this.calculateScrews(sheets);
        const cornerBead = this.calculateCornerBead(rooms, cornerType);
        const primer = includePrimer ? this.calculatePrimer(totalArea) : 0;
        const texture = includeTexture ? this.calculateTexture(totalArea) : 0;

        const materials = {
            sheets,
            mud,
            tape,
            screws,
            cornerBead,
            primer,
            texture
        };

        // Calculate costs
        const materialCosts = this.calculateMaterialCosts(materials, pricing);
        const laborCosts = this.calculateLaborCosts(totalArea, laborRates);

        const subtotal = materialCosts.total + laborCosts.total;
        const markupAmount = subtotal * markup;
        const total = subtotal + markupAmount;

        return {
            areas: {
                wall: totalWallArea,
                ceiling: totalCeilingArea,
                stairs: totalStairArea,
                total: totalArea
            },
            materials,
            costs: {
                materials: materialCosts,
                labor: laborCosts,
                subtotal,
                markup: markupAmount,
                total
            },
            rooms,
            options: {
                wasteFactor,
                finishLevel,
                includePrimer,
                includeTexture,
                tapeType,
                cornerType,
                markup
            }
        };
    },

    /**
     * Calculate optimal sheet layout for a room
     */
    calculateOptimalLayout(room) {
        const { width, length, height } = room;
        const sheetWidth = this.STANDARD_SHEET_SIZE.width;
        const sheetHeight = this.STANDARD_SHEET_SIZE.height;

        // Calculate vertical vs horizontal orientation
        const sheetsVertical = Math.ceil(width / sheetWidth) * Math.ceil(height / sheetHeight);
        const sheetsHorizontal = Math.ceil(width / sheetHeight) * Math.ceil(height / sheetWidth);

        const optimalOrientation = sheetsVertical <= sheetsHorizontal ? 'vertical' : 'horizontal';

        return {
            orientation: optimalOrientation,
            sheets: Math.min(sheetsVertical, sheetsHorizontal),
            vertical: sheetsVertical,
            horizontal: sheetsHorizontal,
            savings: Math.abs(sheetsVertical - sheetsHorizontal)
        };
    },

    /**
     * Estimate time for installation
     */
    estimateInstallationTime(totalArea, finishLevel = 'level4') {
        // Average installation rates (sq ft per hour)
        const rates = {
            hanging: 100, // sq ft per hour
            taping: 80,
            firstCoat: 120,
            secondCoat: 150,
            sanding: 100,
            priming: 200
        };

        const timeEstimate = {
            hanging: totalArea / rates.hanging,
            taping: totalArea / rates.taping,
            firstCoat: totalArea / rates.firstCoat,
            secondCoat: 0,
            sanding: totalArea / rates.sanding,
            priming: totalArea / rates.priming
        };

        // Add additional coats based on finish level
        if (finishLevel === 'level4' || finishLevel === 'level5') {
            timeEstimate.secondCoat = totalArea / rates.secondCoat;
        }

        timeEstimate.total = Object.values(timeEstimate).reduce((sum, time) => sum + time, 0);
        timeEstimate.days = Math.ceil(timeEstimate.total / 8); // 8-hour workdays

        return timeEstimate;
    },

    /**
     * Calculate material waste optimization
     */
    calculateWasteOptimization(rooms) {
        let totalWaste = 0;
        const recommendations = [];

        rooms.forEach(room => {
            const layout = this.calculateOptimalLayout(room);

            if (layout.savings > 0) {
                recommendations.push({
                    room: room.name,
                    suggestion: `Use ${layout.orientation} orientation to save ${layout.savings} sheet(s)`,
                    savings: layout.savings
                });
            }

            // Calculate actual waste
            const actualArea = room.width * room.height;
            const sheetArea = layout.sheets * this.STANDARD_SHEET_SIZE.area;
            const waste = sheetArea - actualArea;
            totalWaste += waste;
        });

        return {
            totalWaste,
            wastePercentage: (totalWaste / (totalWaste + rooms.reduce((sum, r) => sum + r.width * r.height, 0))) * 100,
            recommendations
        };
    },

    /**
     * Calculate by room type (group similar rooms)
     */
    calculateByRoomType(rooms) {
        const byType = {};

        rooms.forEach(room => {
            const type = room.type || 'other';
            if (!byType[type]) {
                byType[type] = {
                    rooms: [],
                    totalWallArea: 0,
                    totalCeilingArea: 0,
                    count: 0
                };
            }

            const wallArea = this.calculateWallArea(room);
            const ceilingArea = room.includeCeiling ? this.calculateCeilingArea(room) : 0;

            byType[type].rooms.push(room.name);
            byType[type].totalWallArea += wallArea.net;
            byType[type].totalCeilingArea += ceilingArea;
            byType[type].count += 1;
        });

        return byType;
    },

    /**
     * Generate detailed material list
     */
    generateMaterialList(estimate) {
        const list = [];

        if (estimate.materials.sheets > 0) {
            list.push({
                category: 'Drywall Sheets',
                item: '1/2" x 4\' x 8\' Drywall Sheet',
                quantity: estimate.materials.sheets,
                unit: 'sheets',
                unitCost: estimate.costs.materials.drywall / estimate.materials.sheets,
                totalCost: estimate.costs.materials.drywall
            });
        }

        if (estimate.materials.mud > 0) {
            list.push({
                category: 'Finishing Materials',
                item: 'Joint Compound (5-gallon bucket)',
                quantity: estimate.materials.mud,
                unit: 'buckets',
                unitCost: estimate.costs.materials.mud / estimate.materials.mud,
                totalCost: estimate.costs.materials.mud
            });
        }

        if (estimate.materials.tape > 0) {
            list.push({
                category: 'Finishing Materials',
                item: `${estimate.options.tapeType === 'paper' ? 'Paper' : 'Mesh'} Tape (75\' roll)`,
                quantity: estimate.materials.tape,
                unit: 'rolls',
                unitCost: estimate.costs.materials.tape / estimate.materials.tape,
                totalCost: estimate.costs.materials.tape
            });
        }

        if (estimate.materials.screws > 0) {
            list.push({
                category: 'Fasteners',
                item: 'Drywall Screws',
                quantity: estimate.materials.screws,
                unit: 'lbs',
                unitCost: estimate.costs.materials.screws / estimate.materials.screws,
                totalCost: estimate.costs.materials.screws
            });
        }

        if (estimate.materials.cornerBead > 0) {
            list.push({
                category: 'Accessories',
                item: `${estimate.options.cornerType === 'metal' ? 'Metal' : 'Bullnose'} Corner Bead (10\')`,
                quantity: estimate.materials.cornerBead,
                unit: 'pieces',
                unitCost: estimate.costs.materials.cornerBead / estimate.materials.cornerBead,
                totalCost: estimate.costs.materials.cornerBead
            });
        }

        if (estimate.materials.primer > 0) {
            list.push({
                category: 'Paint & Finish',
                item: 'Drywall Primer/Sealer',
                quantity: estimate.materials.primer,
                unit: 'gallons',
                unitCost: estimate.costs.materials.primer / estimate.materials.primer,
                totalCost: estimate.costs.materials.primer
            });
        }

        if (estimate.materials.texture > 0) {
            list.push({
                category: 'Paint & Finish',
                item: 'Texture Material',
                quantity: estimate.materials.texture,
                unit: 'bags',
                unitCost: estimate.costs.materials.texture / estimate.materials.texture,
                totalCost: estimate.costs.materials.texture
            });
        }

        return list;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DrywallCalculator;
}
