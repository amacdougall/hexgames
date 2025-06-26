import { CellColorStrategy, Cell } from 'hexboard';

/**
 * Game-specific color strategy that demonstrates advanced coloring logic
 * based on custom properties and terrain types used in the test application.
 * 
 * This strategy showcases:
 * - Terrain type-based coloring using custom properties
 * - Owner-based coloring for gameplay
 * - Special state highlighting (selected, contested, etc.)
 * - Fallback to elevation-based coloring
 */
export class GameColorStrategy implements CellColorStrategy<any> {
  // Terrain type colors
  private static readonly TERRAIN_COLORS = {
    mountain: 0x8B4513,    // Saddle brown
    water: 0x4169E1,       // Royal blue
    forest: 0x228B22,      // Forest green
    plains: 0x9ACD32,      // Yellow green
    desert: 0xF4A460,      // Sandy brown
    tundra: 0x87CEEB,      // Sky blue
    swamp: 0x556B2F,       // Dark olive green
  } as const;

  // Player/owner colors
  private static readonly PLAYER_COLORS = {
    player1: 0xFF0000,     // Red
    player2: 0x0000FF,     // Blue
    player3: 0x00FF00,     // Green
    player4: 0xFFFF00,     // Yellow
    neutral: 0x808080,     // Gray
  } as const;

  // Special state colors
  private static readonly STATE_COLORS = {
    selected: 0xFFFFFF,    // White
    highlighted: 0xFFD700, // Gold
    contested: 0xFF69B4,   // Hot pink
    objective: 0x9932CC,   // Dark orchid
  } as const;

  // Elevation-based fallback colors
  private static readonly ELEVATION_COLORS = {
    veryHigh: 0x654321,    // Dark brown (>3)
    high: 0x8B4513,        // Saddle brown (>2)
    medium: 0x228B22,      // Forest green (>1)
    low: 0x4169E1,         // Royal blue (<=1)
  } as const;

  /**
   * Get the color for a cell based on game-specific logic
   */
  getCellColor(cell: Cell<any>): number {
    // Priority 1: Special states (highest priority)
    if (cell.customProperties?.state) {
      const stateColor = this.getStateColor(cell.customProperties.state);
      if (stateColor !== null) {
        return stateColor;
      }
    }

    // Priority 2: Owner-based coloring for controlled territories
    if (cell.customProperties?.owner) {
      const ownerColor = this.getOwnerColor(cell.customProperties.owner);
      if (ownerColor !== null) {
        // Blend with terrain for subtle owner indication
        const terrainColor = this.getTerrainColor(cell.customProperties?.type);
        return terrainColor !== null ? this.blendColors(ownerColor, terrainColor, 0.3) : ownerColor;
      }
    }

    // Priority 3: Terrain type from custom properties
    if (cell.customProperties?.type) {
      const terrainColor = this.getTerrainColor(cell.customProperties.type);
      if (terrainColor !== null) {
        return terrainColor;
      }
    }

    // Priority 4: Special handling for impassable cells (water)
    if (cell.isImpassable) {
      return GameColorStrategy.TERRAIN_COLORS.water;
    }

    // Priority 5: Elevation-based fallback
    return this.getElevationColor(cell.elevation);
  }

  /**
   * Get color based on special game states
   */
  private getStateColor(state: string): number | null {
    const stateKey = state as keyof typeof GameColorStrategy.STATE_COLORS;
    return GameColorStrategy.STATE_COLORS[stateKey] ?? null;
  }

  /**
   * Get color based on cell owner/controller
   */
  private getOwnerColor(owner: string): number | null {
    const ownerKey = owner as keyof typeof GameColorStrategy.PLAYER_COLORS;
    return GameColorStrategy.PLAYER_COLORS[ownerKey] ?? null;
  }

  /**
   * Get color based on terrain type
   */
  private getTerrainColor(terrainType: string): number | null {
    const terrainKey = terrainType as keyof typeof GameColorStrategy.TERRAIN_COLORS;
    return GameColorStrategy.TERRAIN_COLORS[terrainKey] ?? null;
  }

  /**
   * Get color based on elevation (fallback method)
   */
  private getElevationColor(elevation: number): number {
    if (elevation > 3) {
      return GameColorStrategy.ELEVATION_COLORS.veryHigh;
    } else if (elevation > 2) {
      return GameColorStrategy.ELEVATION_COLORS.high;
    } else if (elevation > 1) {
      return GameColorStrategy.ELEVATION_COLORS.medium;
    } else {
      return GameColorStrategy.ELEVATION_COLORS.low;
    }
  }

  /**
   * Blend two colors together
   * @param color1 First color (hex)
   * @param color2 Second color (hex)
   * @param ratio Blend ratio (0 = full color1, 1 = full color2)
   */
  private blendColors(color1: number, color2: number, ratio: number): number {
    const r1 = (color1 >> 16) & 0xFF;
    const g1 = (color1 >> 8) & 0xFF;
    const b1 = color1 & 0xFF;

    const r2 = (color2 >> 16) & 0xFF;
    const g2 = (color2 >> 8) & 0xFF;
    const b2 = color2 & 0xFF;

    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

    return (r << 16) | (g << 8) | b;
  }
}

/**
 * Alternative simple biome-based strategy that focuses on terrain variety
 */
export class BiomeColorStrategy implements CellColorStrategy<any> {
  private static readonly BIOME_COLORS = {
    arctic: 0xF0F8FF,      // Alice blue
    taiga: 0x2F4F4F,       // Dark slate gray
    temperate: 0x32CD32,   // Lime green
    desert: 0xDEB887,      // Burlywood
    tropical: 0x00FA9A,    // Medium spring green
    ocean: 0x006994,       // Deep blue
  } as const;

  getCellColor(cell: Cell<any>): number {
    // Determine biome based on elevation and custom properties
    const elevation = cell.elevation;
    const isWater = cell.isImpassable || cell.customProperties?.type === 'water';
    
    if (isWater) {
      return BiomeColorStrategy.BIOME_COLORS.ocean;
    }

    // Biome determination based on elevation and latitude (using r coordinate as latitude)
    const latitude = Math.abs(cell.r);
    
    if (elevation > 2.5 || latitude > 3) {
      return BiomeColorStrategy.BIOME_COLORS.arctic;
    } else if (elevation > 1.5 || latitude > 2) {
      return BiomeColorStrategy.BIOME_COLORS.taiga;
    } else if (elevation < 0.5 && latitude < 1) {
      return BiomeColorStrategy.BIOME_COLORS.tropical;
    } else if (elevation < 1 && cell.q > 2) { // Eastern region = desert
      return BiomeColorStrategy.BIOME_COLORS.desert;
    } else {
      return BiomeColorStrategy.BIOME_COLORS.temperate;
    }
  }
}
