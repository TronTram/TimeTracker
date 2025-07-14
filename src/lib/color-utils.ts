import { PROJECT_COLORS, ProjectColor } from '@/types/project';

/**
 * Color utilities for project management
 */

/**
 * Validate if a string is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
}

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!isValidHexColor(hex)) {
    return null;
  }

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16)
  } : null;
}

/**
 * Convert RGB values to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Calculate color luminance for accessibility
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  
  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color meets WCAG accessibility standards
 */
export function isAccessibleColor(color: string, backgroundColor = '#ffffff'): {
  isAccessible: boolean;
  contrastRatio: number;
  level: 'AA' | 'AAA' | 'fail';
} {
  const contrastRatio = getContrastRatio(color, backgroundColor);
  
  let level: 'AA' | 'AAA' | 'fail' = 'fail';
  if (contrastRatio >= 7) {
    level = 'AAA';
  } else if (contrastRatio >= 4.5) {
    level = 'AA';
  }
  
  return {
    isAccessible: contrastRatio >= 4.5,
    contrastRatio,
    level
  };
}

/**
 * Get text color (black or white) that contrasts well with background
 */
export function getContrastingTextColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor);
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Lighten a hex color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  
  const newR = Math.min(255, Math.round(r + (255 - r) * (percent / 100)));
  const newG = Math.min(255, Math.round(g + (255 - g) * (percent / 100)));
  const newB = Math.min(255, Math.round(b + (255 - b) * (percent / 100)));
  
  return rgbToHex(newR, newG, newB);
}

/**
 * Darken a hex color by a percentage
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  
  const newR = Math.max(0, Math.round(r - (r * (percent / 100))));
  const newG = Math.max(0, Math.round(g - (g * (percent / 100))));
  const newB = Math.max(0, Math.round(b - (b * (percent / 100))));
  
  return rgbToHex(newR, newG, newB);
}

/**
 * Generate a random project color from predefined palette
 */
export function getRandomProjectColor(): ProjectColor {
  return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)] || '#3b82f6';
}

/**
 * Get complementary colors for a given color
 */
export function getComplementaryColors(hex: string): string[] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [];

  const { r, g, b } = rgb;
  
  // Generate complementary, triadic, and analogous colors
  const complementary = rgbToHex(255 - r, 255 - g, 255 - b);
  
  // Simple triadic colors (120 degree shifts in HSL space)
  const triadic1 = rgbToHex(g, b, r);
  const triadic2 = rgbToHex(b, r, g);
  
  return [complementary, triadic1, triadic2];
}

/**
 * Create color variations for hover/active states
 */
export function createColorVariations(hex: string): {
  base: string;
  hover: string;
  active: string;
  light: string;
  dark: string;
  muted: string;
} {
  return {
    base: hex,
    hover: lightenColor(hex, 10),
    active: darkenColor(hex, 10),
    light: lightenColor(hex, 30),
    dark: darkenColor(hex, 20),
    muted: lightenColor(hex, 50),
  };
}

/**
 * Generate CSS custom properties for a project color
 */
export function generateColorCSSProperties(color: string, prefix = 'project'): Record<string, string> {
  const variations = createColorVariations(color);
  const textColor = getContrastingTextColor(color);
  
  return {
    [`--${prefix}-color`]: variations.base,
    [`--${prefix}-color-hover`]: variations.hover,
    [`--${prefix}-color-active`]: variations.active,
    [`--${prefix}-color-light`]: variations.light,
    [`--${prefix}-color-dark`]: variations.dark,
    [`--${prefix}-color-muted`]: variations.muted,
    [`--${prefix}-text-color`]: textColor,
  };
}

/**
 * Sort colors by similarity to a target color
 */
export function sortColorsBySimilarity(colors: string[], targetColor: string): string[] {
  const targetRgb = hexToRgb(targetColor);
  if (!targetRgb) return colors;

  return colors.sort((a, b) => {
    const aRgb = hexToRgb(a);
    const bRgb = hexToRgb(b);
    
    if (!aRgb || !bRgb) return 0;
    
    // Calculate Euclidean distance in RGB space
    const aDistance = Math.sqrt(
      Math.pow(aRgb.r - targetRgb.r, 2) +
      Math.pow(aRgb.g - targetRgb.g, 2) +
      Math.pow(aRgb.b - targetRgb.b, 2)
    );
    
    const bDistance = Math.sqrt(
      Math.pow(bRgb.r - targetRgb.r, 2) +
      Math.pow(bRgb.g - targetRgb.g, 2) +
      Math.pow(bRgb.b - targetRgb.b, 2)
    );
    
    return aDistance - bDistance;
  });
}

/**
 * Generate a color palette from a base color
 */
export function generateColorPalette(baseColor: string, count = 5): string[] {
  const palette: string[] = [baseColor];
  
  for (let i = 1; i < count; i++) {
    const hueShift = (360 / count) * i;
    // This is a simplified approach - in a real implementation,
    // you'd want to convert to HSL, shift hue, then back to hex
    const shifted = lightenColor(baseColor, (i * 20) % 80);
    palette.push(shifted);
  }
  
  return palette;
}

/**
 * Validate and sanitize color input
 */
export function sanitizeColor(input: string): string | null {
  if (!input) return null;
  
  // Remove whitespace
  const cleaned = input.trim();
  
  // Add # if missing
  const withHash = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
  
  // Validate
  if (isValidHexColor(withHash)) {
    return withHash.toUpperCase();
  }
  
  return null;
}

/**
 * Get predefined project colors with metadata
 */
export function getProjectColorOptions(): Array<{
  value: ProjectColor;
  label: string;
  accessibility: ReturnType<typeof isAccessibleColor>;
  variations: ReturnType<typeof createColorVariations>;
}> {
  const colorNames: Record<ProjectColor, string> = {
    '#3b82f6': 'Blue',
    '#ef4444': 'Red',
    '#10b981': 'Green',
    '#f59e0b': 'Yellow',
    '#8b5cf6': 'Purple',
    '#f97316': 'Orange',
    '#06b6d4': 'Cyan',
    '#84cc16': 'Lime',
    '#ec4899': 'Pink',
    '#6b7280': 'Gray',
    '#14b8a6': 'Teal',
    '#a855f7': 'Violet',
  };

  return PROJECT_COLORS.map(color => ({
    value: color,
    label: colorNames[color],
    accessibility: isAccessibleColor(color),
    variations: createColorVariations(color),
  }));
}
