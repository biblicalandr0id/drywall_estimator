import { describe, it, expect } from 'vitest';
import { DrywallCalculator } from '../src/calculator';
import type { Room } from '@drywall/types';

describe('DrywallCalculator', () => {
  const calculator = new DrywallCalculator();

  describe('calculateWallArea', () => {
    it('should calculate basic wall area correctly', () => {
      const room: Room = {
        name: 'Test Room',
        width: 10,
        length: 12,
        height: 8,
        doors: 1,
        windows: 2,
      };

      const result = calculator.calculateWallArea(room);

      // Perimeter: 2 * (10 + 12) = 44 feet
      // Gross area: 44 * 8 = 352 sq ft
      expect(result.gross).toBe(352);
      expect(result.perimeter).toBe(44);

      // Openings: 1 door (21 sq ft) + 2 windows (24 sq ft) = 45 sq ft
      expect(result.openings).toBe(45);

      // Net area: 352 - 45 = 307 sq ft
      expect(result.net).toBe(307);
    });

    it('should handle rooms with no doors or windows', () => {
      const room: Room = {
        name: 'Closet',
        width: 4,
        length: 6,
        height: 8,
      };

      const result = calculator.calculateWallArea(room);

      // Perimeter: 2 * (4 + 6) = 20 feet
      // Gross area: 20 * 8 = 160 sq ft
      expect(result.gross).toBe(160);
      expect(result.openings).toBe(0);
      expect(result.net).toBe(160);
    });
  });

  describe('calculateCeilingArea', () => {
    it('should calculate standard ceiling area', () => {
      const room: Room = {
        name: 'Living Room',
        width: 15,
        length: 20,
        height: 9,
        ceilingType: 'standard',
      };

      const result = calculator.calculateCeilingArea(room);
      expect(result).toBe(300); // 15 * 20
    });

    it('should calculate vaulted ceiling area with multiplier', () => {
      const room: Room = {
        name: 'Living Room',
        width: 15,
        length: 20,
        height: 12,
        ceilingType: 'vaulted',
      };

      const result = calculator.calculateCeilingArea(room);
      expect(result).toBe(420); // 15 * 20 * 1.4
    });

    it('should return 0 for no ceiling', () => {
      const room: Room = {
        name: 'Garage',
        width: 20,
        length: 20,
        height: 9,
        ceilingType: 'none',
      };

      const result = calculator.calculateCeilingArea(room);
      expect(result).toBe(0);
    });
  });

  describe('calculateSheets', () => {
    it('should calculate sheets needed with waste factor', () => {
      const totalArea = 320; // 10 sheets at 32 sq ft each
      const result = calculator.calculateSheets(totalArea, 0.1);

      // 320 * 1.1 = 352 sq ft
      // 352 / 32 = 11 sheets
      expect(result).toBe(11);
    });

    it('should round up partial sheets', () => {
      const totalArea = 100;
      const result = calculator.calculateSheets(totalArea, 0.1);

      // 100 * 1.1 = 110 sq ft
      // 110 / 32 = 3.4375 -> rounds to 4 sheets
      expect(result).toBe(4);
    });
  });

  describe('calculateJointCompound', () => {
    it('should calculate mud for level 4 finish', () => {
      const sheets = 40;
      const result = calculator.calculateJointCompound(sheets, 'level4');

      // 40 sheets / 8 sheets per bucket * 1.25 = 6.25 -> rounds to 7 buckets
      expect(result).toBe(7);
    });

    it('should calculate mud for level 5 finish', () => {
      const sheets = 40;
      const result = calculator.calculateJointCompound(sheets, 'level5');

      // 40 sheets / 8 sheets per bucket * 1.5 = 7.5 -> rounds to 8 buckets
      expect(result).toBe(8);
    });
  });

  describe('calculateTape', () => {
    it('should calculate paper tape needed', () => {
      const sheets = 40;
      const result = calculator.calculateTape(sheets, 'paper');

      // 40 sheets * 6 linear feet = 240 feet
      // 240 / 75 feet per roll = 3.2 -> rounds to 4 rolls
      expect(result).toBe(4);
    });

    it('should calculate less mesh tape needed', () => {
      const sheets = 40;
      const result = calculator.calculateTape(sheets, 'mesh');

      // 40 sheets * 6 linear feet = 240 feet
      // 240 / 75 feet per roll = 3.2 -> rounds to 4 rolls
      // Mesh tape uses 80% -> 4 * 0.8 = 3.2 -> rounds to 4 rolls
      expect(result).toBe(4);
    });
  });

  describe('calculateScrews', () => {
    it('should calculate screws needed in pounds', () => {
      const sheets = 50;
      const result = calculator.calculateScrews(sheets);

      // 50 sheets * 30 screws = 1500 screws
      // 1500 / 200 screws per pound = 7.5 -> rounds to 8 lbs
      expect(result).toBe(8);
    });
  });
});
