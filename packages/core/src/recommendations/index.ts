/**
 * Smart Recommendations Engine
 * Provides context-aware suggestions for material selection, cost optimization,
 * code compliance, and best practices
 */

const RecommendationEngine = {
    /**
     * Generate all recommendations for a project
     */
    generateRecommendations(project, estimate) {
        const recommendations = [];

        // Material recommendations
        recommendations.push(...this.getMaterialRecommendations(project));

        // Room-specific recommendations
        recommendations.push(...this.getRoomTypeRecommendations(project));

        // Cost optimization recommendations
        if (estimate) {
            recommendations.push(...this.getCostOptimizationRecommendations(estimate, project));
        }

        // Code compliance recommendations
        recommendations.push(...this.getCodeComplianceRecommendations(project));

        // Installation best practices
        recommendations.push(...this.getInstallationRecommendations(project));

        // Safety recommendations
        recommendations.push(...this.getSafetyRecommendations(project));

        return recommendations;
    },

    /**
     * Material-specific recommendations
     */
    getMaterialRecommendations(project) {
        const recommendations = [];
        const rooms = this.getAllRooms(project);

        rooms.forEach(room => {
            const type = room.type || 'standard';

            // Moisture-resistant drywall for wet areas
            if (['bathroom', 'kitchen', 'laundry'].includes(type)) {
                if (room.drywallType !== 'moisture') {
                    recommendations.push({
                        type: 'warning',
                        category: 'Material Selection',
                        room: room.name,
                        title: 'Use Moisture-Resistant Drywall',
                        message: `${room.name} should use moisture-resistant (green board or purple board) drywall to prevent mold and water damage.`,
                        action: 'Switch to moisture-resistant drywall',
                        priority: 'high',
                        code: 'Use 1/2" or 5/8" moisture-resistant gypsum board in wet areas'
                    });
                }

                recommendations.push({
                    type: 'info',
                    category: 'Material Selection',
                    room: room.name,
                    title: 'Consider Cement Board for Tile Areas',
                    message: `For areas where tile will be installed (shower, tub surround), cement backer board is required instead of standard drywall.`,
                    priority: 'medium'
                });
            }

            // Fire-rated drywall for garage
            if (type === 'garage') {
                if (room.drywallType !== 'firerated' && room.drywallType !== 'typex') {
                    recommendations.push({
                        type: 'warning',
                        category: 'Code Compliance',
                        room: room.name,
                        title: 'Fire-Rated Drywall Required',
                        message: `Garages attached to living spaces require 5/8" Type X fire-rated drywall on walls and ceiling for fire safety.`,
                        action: 'Switch to 5/8" Type X drywall',
                        priority: 'high',
                        code: 'IRC R302.6 requires 1/2-hour fire rating between garage and dwelling'
                    });
                }
            }

            // Soundproofing recommendations
            if (['bedroom', 'office'].includes(type)) {
                recommendations.push({
                    type: 'info',
                    category: 'Upgrade Options',
                    room: room.name,
                    title: 'Consider Soundproofing',
                    message: `For better sound isolation, consider using 5/8" drywall, resilient channels, or sound-dampening insulation.`,
                    priority: 'low'
                });
            }

            // High-ceiling recommendations
            if (room.height > 10) {
                recommendations.push({
                    type: 'info',
                    category: 'Installation',
                    room: room.name,
                    title: 'Special Equipment Needed',
                    message: `Ceiling height of ${room.height}' requires drywall lifts or scaffolding. Consider using 12' or 14' sheets to minimize horizontal joints.`,
                    priority: 'medium'
                });
            }
        });

        return recommendations;
    },

    /**
     * Room type-specific recommendations
     */
    getRoomTypeRecommendations(project) {
        const recommendations = [];
        const rooms = this.getAllRooms(project);

        // Bathroom recommendations
        const bathrooms = rooms.filter(r => r.type === 'bathroom');
        if (bathrooms.length > 0) {
            recommendations.push({
                type: 'info',
                category: 'Best Practices',
                title: 'Bathroom Installation Tips',
                message: `
                    - Install cement board behind all tile areas
                    - Use mold-resistant joint compound
                    - Ensure proper ventilation to prevent moisture buildup
                    - Leave 1/4" gap between drywall and tub/shower pan
                    - Caulk all gaps with waterproof silicone caulk
                `,
                priority: 'high',
                rooms: bathrooms.map(r => r.name)
            });
        }

        // Kitchen recommendations
        const kitchens = rooms.filter(r => r.type === 'kitchen');
        if (kitchens.length > 0) {
            recommendations.push({
                type: 'info',
                category: 'Best Practices',
                title: 'Kitchen Installation Tips',
                message: `
                    - Use moisture-resistant drywall behind sink areas
                    - Plan for electrical boxes before hanging drywall
                    - Account for cabinet mounting - use 5/8" for heavy cabinets
                    - Consider backing for range hood mounting
                `,
                priority: 'medium',
                rooms: kitchens.map(r => r.name)
            });
        }

        // Basement recommendations
        const basements = rooms.filter(r => r.type === 'basement');
        if (basements.length > 0) {
            recommendations.push({
                type: 'warning',
                category: 'Code Compliance',
                title: 'Basement Requirements',
                message: `
                    - Check for moisture issues before installation
                    - Consider vapor barrier if below grade
                    - Use mold-resistant drywall in basement areas
                    - Ensure proper egress windows in bedrooms
                    - Verify headroom clearance (minimum 7')
                `,
                priority: 'high',
                rooms: basements.map(r => r.name)
            });
        }

        return recommendations;
    },

    /**
     * Cost optimization recommendations
     */
    getCostOptimizationRecommendations(estimate, project) {
        const recommendations = [];

        // Check waste factor
        if (estimate.options.wasteFactor > 0.15) {
            recommendations.push({
                type: 'warning',
                category: 'Cost Optimization',
                title: 'High Waste Factor',
                message: `Your waste factor of ${(estimate.options.wasteFactor * 100).toFixed(0)}% is higher than typical (10-15%). This may be adding unnecessary cost. Consider optimizing sheet layout.`,
                action: 'Reduce waste factor to 10-12%',
                priority: 'medium',
                savings: estimate.costs.materials.drywall * (estimate.options.wasteFactor - 0.10)
            });
        }

        // Bulk purchasing recommendations
        if (estimate.materials.sheets > 50) {
            recommendations.push({
                type: 'success',
                category: 'Cost Optimization',
                title: 'Bulk Purchase Discount Available',
                message: `With ${estimate.materials.sheets} sheets needed, you qualify for bulk pricing. Contact suppliers for 10-15% discounts on large orders.`,
                priority: 'high',
                savings: estimate.costs.materials.drywall * 0.125 // Avg 12.5% savings
            });
        }

        // Finish level optimization
        if (estimate.options.finishLevel === 'level5') {
            recommendations.push({
                type: 'info',
                category: 'Cost Optimization',
                title: 'Level 5 Finish Is Premium',
                message: `Level 5 finish is the highest quality but adds significant cost. Consider if Level 4 is sufficient for your needs (standard for most applications).`,
                priority: 'medium',
                savings: estimate.costs.labor.total * 0.20 // Approx 20% savings
            });
        }

        // Material substitution suggestions
        const totalCost = estimate.costs.total;
        if (totalCost > 5000) {
            recommendations.push({
                type: 'info',
                category: 'Cost Optimization',
                title: 'Consider Material Alternatives',
                message: `
                    Potential cost savings:
                    - Standard vs. lightweight drywall (similar cost, easier to install)
                    - Paper tape vs. mesh tape (paper is cheaper, mesh is faster)
                    - Pre-mixed vs. powder joint compound (powder is cheaper for large jobs)
                `,
                priority: 'low'
            });
        }

        // Seasonal pricing
        recommendations.push({
            type: 'info',
            category: 'Cost Optimization',
            title: 'Best Time to Buy',
            message: `Material prices are typically lower in winter months (Jan-Feb) and late summer (Aug-Sep). Consider timing your project accordingly.`,
            priority: 'low'
        });

        return recommendations;
    },

    /**
     * Code compliance recommendations
     */
    getCodeComplianceRecommendations(project) {
        const recommendations = [];
        const rooms = this.getAllRooms(project);

        // Fire separation requirements
        const garages = rooms.filter(r => r.type === 'garage');
        if (garages.length > 0) {
            recommendations.push({
                type: 'warning',
                category: 'Code Compliance',
                title: 'Garage Fire Separation',
                message: `IRC R302.6 requires 1/2-hour fire-resistance rating between garage and living space. Use 5/8" Type X drywall on garage side, including ceiling if there's living space above.`,
                code: 'IRC R302.6',
                priority: 'high'
            });
        }

        // Ceiling height requirements
        rooms.forEach(room => {
            if (room.height < 7) {
                recommendations.push({
                    type: 'danger',
                    category: 'Code Compliance',
                    room: room.name,
                    title: 'Minimum Ceiling Height Violation',
                    message: `IRC R305.1 requires minimum 7' ceiling height for habitable rooms. ${room.name} has only ${room.height}' height.`,
                    code: 'IRC R305.1',
                    priority: 'high'
                });
            }
        });

        // Moisture barrier requirements
        const wetRooms = rooms.filter(r => ['bathroom', 'laundry'].includes(r.type));
        if (wetRooms.length > 0) {
            recommendations.push({
                type: 'info',
                category: 'Code Compliance',
                title: 'Vapor Barrier Requirements',
                message: `Check local codes for vapor barrier requirements in wet areas. Many jurisdictions require poly sheeting behind drywall in bathrooms.`,
                code: 'Local Building Code',
                priority: 'medium'
            });
        }

        // Accessibility requirements
        recommendations.push({
            type: 'info',
            category: 'Code Compliance',
            title: 'Accessibility Considerations',
            message: `If building for accessibility (ADA), ensure proper backing for grab bars in bathrooms and appropriate outlet/switch heights.`,
            code: 'ADA Standards',
            priority: 'low'
        });

        return recommendations;
    },

    /**
     * Installation best practices
     */
    getInstallationRecommendations(project) {
        const recommendations = [];

        recommendations.push({
            type: 'success',
            category: 'Best Practices',
            title: 'Drywall Hanging Tips',
            message: `
                BEFORE YOU START:
                - Hang ceiling first, then walls
                - Run sheets perpendicular to framing
                - Stagger seams (brick pattern)
                - Keep seams away from door/window corners
                - Use appropriate screw spacing (12" ceiling, 16" walls)
                - Don't overdrive screws (dimple, don't break paper)
            `,
            priority: 'high'
        });

        recommendations.push({
            type: 'info',
            category: 'Best Practices',
            title: 'Taping & Finishing Tips',
            message: `
                FINISHING STEPS:
                1. Fill all screw holes and joints
                2. Apply tape while compound is wet
                3. Allow proper drying time between coats
                4. Use wider knives for each coat (6", 10", 12")
                5. Sand between coats (except final coat before texture)
                6. Prime before painting or texturing
            `,
            priority: 'medium'
        });

        recommendations.push({
            type: 'info',
            category: 'Best Practices',
            title: 'Tools You'll Need',
            message: `
                Essential tools:
                - Drywall lift (for ceilings)
                - Screw gun with depth setter
                - T-square and utility knife
                - Taping knives (6", 10", 12")
                - Mud pan and hawk
                - Sanding pole and sanding sponge
                - Dust mask and safety glasses
            `,
            priority: 'low'
        });

        return recommendations;
    },

    /**
     * Safety recommendations
     */
    getSafetyRecommendations(project) {
        const recommendations = [];

        recommendations.push({
            type: 'warning',
            category: 'Safety',
            title: 'Drywall Dust Safety',
            message: `
                Drywall dust can be harmful:
                - Always wear N95 or better dust mask when sanding
                - Use proper ventilation
                - Wear safety glasses to protect eyes
                - Consider wet sanding to reduce airborne dust
                - Clean up thoroughly - dust is combustible
            `,
            priority: 'high'
        });

        recommendations.push({
            type: 'warning',
            category: 'Safety',
            title: 'Lifting Safety',
            message: `
                Drywall sheets are heavy (50-70 lbs):
                - Always get help lifting sheets, especially overhead
                - Use a drywall lift for ceilings
                - Bend at knees, not waist
                - Use proper footwear with good traction
                - Watch for overhead hazards
            `,
            priority: 'high'
        });

        recommendations.push({
            type: 'info',
            category: 'Safety',
            title: 'Electrical & Plumbing Safety',
            message: `
                Before cutting or drilling:
                - Turn off power to work area
                - Use electrical tester to verify power is off
                - Mark all electrical boxes before hanging
                - Be aware of plumbing locations
                - Never drill near corners (pipes/wires often run there)
            `,
            priority: 'high'
        });

        return recommendations;
    },

    /**
     * Get all rooms from project
     */
    getAllRooms(project) {
        const rooms = [];
        if (project.floors) {
            project.floors.forEach(floor => {
                if (floor.rooms) {
                    rooms.push(...floor.rooms);
                }
            });
        }
        return rooms;
    },

    /**
     * Generate recommendations summary
     */
    generateSummary(recommendations) {
        const byCategory = {};
        const byPriority = {
            high: [],
            medium: [],
            low: []
        };

        recommendations.forEach(rec => {
            // Group by category
            if (!byCategory[rec.category]) {
                byCategory[rec.category] = [];
            }
            byCategory[rec.category].push(rec);

            // Group by priority
            if (rec.priority && byPriority[rec.priority]) {
                byPriority[rec.priority].push(rec);
            }
        });

        // Calculate potential savings
        const totalSavings = recommendations
            .filter(r => r.savings)
            .reduce((sum, r) => sum + r.savings, 0);

        return {
            total: recommendations.length,
            byCategory,
            byPriority,
            totalPotentialSavings: totalSavings,
            highPriorityCount: byPriority.high.length,
            hasCodeIssues: recommendations.some(r => r.category === 'Code Compliance' && r.priority === 'high')
        };
    },

    /**
     * Filter recommendations by type
     */
    filterByType(recommendations, type) {
        return recommendations.filter(r => r.type === type);
    },

    /**
     * Filter recommendations by priority
     */
    filterByPriority(recommendations, priority) {
        return recommendations.filter(r => r.priority === priority);
    },

    /**
     * Filter recommendations by room
     */
    filterByRoom(recommendations, roomName) {
        return recommendations.filter(r => r.room === roomName || (r.rooms && r.rooms.includes(roomName)));
    },

    /**
     * Advanced recommendations based on project analysis
     */
    getAdvancedRecommendations(project, estimate) {
        const recommendations = [];
        const rooms = this.getAllRooms(project);

        // Analyze room layout for efficiency
        const layoutAnalysis = this.analyzeLayout(rooms);
        if (layoutAnalysis.suggestions.length > 0) {
            recommendations.push({
                type: 'info',
                category: 'Layout Optimization',
                title: 'Layout Improvements Suggested',
                message: layoutAnalysis.suggestions.join('\n'),
                priority: 'medium'
            });
        }

        // Material efficiency analysis
        if (estimate) {
            const efficiency = this.analyzeMaterialEfficiency(estimate);
            if (efficiency.wastePercentage > 15) {
                recommendations.push({
                    type: 'warning',
                    category: 'Material Efficiency',
                    title: 'High Material Waste Detected',
                    message: `Current layout results in ${efficiency.wastePercentage.toFixed(1)}% material waste. Consider sheet orientation optimization.`,
                    priority: 'medium',
                    savings: estimate.costs.materials.drywall * (efficiency.wastePercentage - 10) / 100
                });
            }
        }

        // Multi-floor considerations
        if (project.floors && project.floors.length > 1) {
            recommendations.push({
                type: 'info',
                category: 'Multi-Floor Installation',
                title: 'Multi-Story Installation Tips',
                message: `
                    - Work from top floor down
                    - Consider soundproofing between floors
                    - Use fire-rated drywall between floors in some jurisdictions
                    - Plan material delivery and staging carefully
                `,
                priority: 'medium'
            });
        }

        return recommendations;
    },

    /**
     * Analyze room layout for optimization opportunities
     */
    analyzeLayout(rooms) {
        const suggestions = [];

        // Check for unusually small rooms
        const smallRooms = rooms.filter(r => r.width * r.length < 50);
        if (smallRooms.length > 0) {
            suggestions.push(`Found ${smallRooms.length} room(s) under 50 sq ft. Consider combining with adjacent spaces if possible.`);
        }

        // Check for high ceilings
        const highCeilings = rooms.filter(r => r.height > 9);
        if (highCeilings.length > 0) {
            suggestions.push(`${highCeilings.length} room(s) have ceilings over 9'. Use 12' or 14' sheets to minimize waste.`);
        }

        // Check for many small rooms (inefficient)
        if (rooms.length > 10 && rooms.filter(r => r.width * r.length < 100).length > 5) {
            suggestions.push('Many small rooms detected. This increases labor time for cutting and finishing.');
        }

        return { suggestions };
    },

    /**
     * Analyze material efficiency
     */
    analyzeMaterialEfficiency(estimate) {
        const actualArea = estimate.areas.total;
        const sheetsUsed = estimate.materials.sheets;
        const sheetArea = sheetsUsed * 32; // Standard sheet is 32 sq ft
        const wasteArea = sheetArea - actualArea;
        const wastePercentage = (wasteArea / actualArea) * 100;

        return {
            actualArea,
            sheetArea,
            wasteArea,
            wastePercentage,
            isEfficient: wastePercentage <= 15
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecommendationEngine;
}
