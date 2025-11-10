// Room and door/window types
export interface DoorDetail {
  width?: number;
  height?: number;
}

export interface WindowDetail {
  width?: number;
  height?: number;
}

export type CeilingType = 'standard' | 'vaulted' | 'tray' | 'coffered' | 'none';

export interface Room {
  name: string;
  width: number;
  length: number;
  height: number;
  doors?: number;
  windows?: number;
  doorDetails?: DoorDetail[];
  windowDetails?: WindowDetail[];
  ceilingType?: CeilingType;
  includeCeiling?: boolean;
  type?: string;
  corners?: number;
}

// Stairwell types
export interface Stairwell {
  risers?: number;
  treadWidth?: number;
  riserHeight?: number;
  width?: number;
  length?: number;
  wallsBothSides?: boolean;
  underCeiling?: boolean;
}

// Floor and project types
export interface Floor {
  rooms: Room[];
  stairs?: Stairwell[];
}

export interface Project {
  floors: Floor[];
}

// Calculation results types
export interface WallAreaResult {
  gross: number;
  openings: number;
  net: number;
  perimeter: number;
}

export interface StairwellAreaResult {
  walls: number;
  ceiling: number;
  stairwellWalls: number;
  total: number;
  angle: number;
}

export interface Materials {
  sheets: number;
  mud: number;
  tape: number;
  screws: number;
  cornerBead: number;
  primer: number;
  texture: number;
}

export interface MaterialCosts {
  drywall: number;
  mud: number;
  tape: number;
  screws: number;
  cornerBead: number;
  primer: number;
  texture: number;
  total: number;
}

export interface LaborCosts {
  hanging: number;
  taping: number;
  finishing: number;
  total: number;
}

export interface EstimateOptions {
  wasteFactor?: number;
  finishLevel?: 'level0' | 'level1' | 'level2' | 'level3' | 'level4' | 'level5';
  includePrimer?: boolean;
  includeTexture?: boolean;
  tapeType?: 'paper' | 'mesh';
  cornerType?: 'metal' | 'bullnose';
  markup?: number;
}

export interface Pricing {
  drywallPerSheet: number;
  mudPerBucket: number;
  tapePerRoll: number;
  screwsPerPound: number;
  cornerBeadPer10ft: number;
  primerPerGallon: number;
  texturePerBag: number;
}

export interface LaborRates {
  hanging: number;
  taping: number;
  finishing: number;
}

export interface ProjectEstimate {
  areas: {
    wall: number;
    ceiling: number;
    stairs: number;
    total: number;
  };
  materials: Materials;
  costs: {
    materials: MaterialCosts;
    labor: LaborCosts;
    subtotal: number;
    markup: number;
    total: number;
  };
  rooms: Array<{
    name: string;
    wallArea: number;
    ceilingArea: number;
    type?: string;
  }>;
  options: Required<EstimateOptions>;
}

export interface OptimalLayout {
  orientation: 'vertical' | 'horizontal';
  sheets: number;
  vertical: number;
  horizontal: number;
  savings: number;
}

export interface InstallationTime {
  hanging: number;
  taping: number;
  firstCoat: number;
  secondCoat: number;
  sanding: number;
  priming: number;
  total: number;
  days: number;
}

export interface WasteOptimization {
  totalWaste: number;
  wastePercentage: number;
  recommendations: Array<{
    room: string;
    suggestion: string;
    savings: number;
  }>;
}

export interface RoomTypeBreakdown {
  [type: string]: {
    rooms: string[];
    totalWallArea: number;
    totalCeilingArea: number;
    count: number;
  };
}

export interface MaterialListItem {
  category: string;
  item: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}
