'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dropdown } from '@/components/ui/dropdown';
import { 
  isValidHexColor, 
  getContrastingTextColor,
  createColorVariations
} from '@/lib/color-utils';
import { Palette, Check, Pipette } from 'lucide-react';

// Project color palette
const PROJECT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
  label?: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ColorPicker({
  value,
  onChange,
  disabled = false,
  className,
  showLabel = false,
  label = 'Color',
  placeholder = 'Select a color',
  size = 'md',
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Validate current value and ensure string
  const safeValue = (value || PROJECT_COLORS[0]) as string;
  const displayColor = (isValidHexColor(safeValue) ? safeValue : PROJECT_COLORS[0]) as string;
  const textColor = getContrastingTextColor(displayColor);
  const colorVariations = createColorVariations(displayColor);

  // Handle preset color selection
  const handlePresetColor = (color: string) => {
    onChange(color);
    setIsOpen(false);
    setShowCustomInput(false);
    setCustomColor('');
  };

  // Handle custom color input
  const handleCustomColorChange = (inputValue: string) => {
    setCustomColor(inputValue);
    
    // Auto-add # if not present
    let colorValue = inputValue.trim();
    if (colorValue && !colorValue.startsWith('#')) {
      colorValue = `#${colorValue}`;
    }
    
    // Validate and apply if valid
    if (isValidHexColor(colorValue)) {
      onChange(colorValue);
    }
  };

  // Handle custom color submit
  const handleCustomColorSubmit = () => {
    let colorValue = customColor.trim();
    if (colorValue && !colorValue.startsWith('#')) {
      colorValue = `#${colorValue}`;
    }
    
    if (isValidHexColor(colorValue)) {
      onChange(colorValue);
      setIsOpen(false);
      setShowCustomInput(false);
      setCustomColor('');
    }
  };

  // Show custom color input
  const handleShowCustomInput = () => {
    setShowCustomInput(true);
    setTimeout(() => {
      customInputRef.current?.focus();
    }, 100);
  };

  // Handle dropdown state change
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setShowCustomInput(false);
      setCustomColor('');
    }
  };

  // Focus custom input when shown
  useEffect(() => {
    if (showCustomInput && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [showCustomInput]);

  // Size variants
  const sizeClasses = {
    sm: {
      trigger: 'h-8 px-2 text-sm',
      colorBox: 'w-4 h-4',
      grid: 'grid-cols-6 gap-1',
      colorSwatch: 'w-6 h-6',
    },
    md: {
      trigger: 'h-10 px-3',
      colorBox: 'w-5 h-5',
      grid: 'grid-cols-5 gap-2',
      colorSwatch: 'w-8 h-8',
    },
    lg: {
      trigger: 'h-12 px-4 text-lg',
      colorBox: 'w-6 h-6',
      grid: 'grid-cols-4 gap-3',
      colorSwatch: 'w-10 h-10',
    },
  };

  const sizes = sizeClasses[size];

  // Check if current color is in presets
  const isPresetColor = PROJECT_COLORS.includes(displayColor);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {showLabel && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Color Picker Trigger */}
      <Dropdown
        open={isOpen}
        onOpenChange={handleOpenChange}
        trigger={
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'justify-start gap-2 bg-white',
              sizes.trigger,
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* Color Display */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className={cn(
                  'rounded border border-gray-300 flex-shrink-0',
                  sizes.colorBox
                )}
                style={{ backgroundColor: displayColor }}
              />
              <span className="text-gray-700 truncate">
                {displayColor.toUpperCase()}
              </span>
            </div>
            
            {/* Dropdown Icon */}
            <Palette className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </Button>
        }
        align="start"
        sideOffset={4}
      >
        <div className="p-3 w-64">
          {/* Preset Colors */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Preset Colors</div>
            <div className={cn('grid', sizes.grid)}>
              {PROJECT_COLORS.map((color) => {
                const isSelected = displayColor === color;
                const contrastColor = getContrastingTextColor(color);
                
                return (
                  <button
                    key={color}
                    onClick={() => handlePresetColor(color)}
                    className={cn(
                      'rounded-lg border-2 transition-all hover:scale-105 flex items-center justify-center',
                      sizes.colorSwatch,
                      isSelected 
                        ? 'border-gray-900 ring-2 ring-blue-500' 
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    style={{ backgroundColor: color }}
                    title={color.toUpperCase()}
                  >
                    {isSelected && (
                      <Check 
                        className="w-3 h-3" 
                        style={{ color: contrastColor }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Section */}
          <div className="border-t border-gray-200 pt-3 mt-3 space-y-3">
            <div className="text-sm font-medium text-gray-700">Custom Color</div>
            
            {!showCustomInput ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowCustomInput}
                className="w-full justify-start gap-2"
              >
                <Pipette className="w-4 h-4" />
                Enter custom color
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    ref={customInputRef}
                    type="text"
                    placeholder="#FF5733"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCustomColorSubmit();
                      } else if (e.key === 'Escape') {
                        setShowCustomInput(false);
                        setCustomColor('');
                      }
                    }}
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleCustomColorSubmit}
                    disabled={!customColor || !isValidHexColor(
                      customColor.startsWith('#') ? customColor : `#${customColor}`
                    )}
                  >
                    Apply
                  </Button>
                </div>
                
                {/* Custom Color Preview */}
                {customColor && isValidHexColor(
                  customColor.startsWith('#') ? customColor : `#${customColor}`
                ) && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ 
                        backgroundColor: customColor.startsWith('#') 
                          ? customColor 
                          : `#${customColor}` 
                      }}
                    />
                    <span className="text-sm font-mono text-gray-600">
                      {(customColor.startsWith('#') ? customColor : `#${customColor}`).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Current Color Display */}
          {!isPresetColor && (
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Current Color</div>
              <div 
                className="w-full h-12 rounded-lg border border-gray-300 flex items-center justify-center"
                style={{ backgroundColor: displayColor }}
              >
                <span 
                  className="font-mono text-sm font-medium"
                  style={{ color: textColor }}
                >
                  {displayColor.toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </Dropdown>
    </div>
  );
}
