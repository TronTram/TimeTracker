'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PROJECT_COLORS } from '@/types/project';
import { isValidHexColor, getContrastingTextColor } from '@/lib/color-utils';
import { CheckIcon } from 'lucide-react';

interface ColorInputProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  showPalette?: boolean;
  allowCustom?: boolean;
}

export function ColorInput({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = '#3b82f6',
  showPalette = true,
  allowCustom = true,
}: ColorInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState(value);
  const [isValidCustom, setIsValidCustom] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Validate custom color input
  useEffect(() => {
    if (customValue) {
      setIsValidCustom(isValidHexColor(customValue));
    }
  }, [customValue]);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setCustomValue(color);
    setIsOpen(false);
  };

  const handleCustomColorSubmit = () => {
    if (isValidCustom && customValue) {
      onChange(customValue);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleCustomColorSubmit();
    }
    if (event.key === 'Escape') {
      setIsOpen(false);
      setCustomValue(value);
    }
  };

  const textColor = getContrastingTextColor(value);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Color Preview Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-2 border rounded-md',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'hover:border-gray-400 transition-colors'
        )}
        aria-label="Select color"
      >
        {/* Color Preview */}
        <div
          className="w-5 h-5 rounded border border-gray-300 flex-shrink-0"
          style={{ backgroundColor: value, color: textColor }}
        >
          {/* Show checkmark if color is from palette */}
          {PROJECT_COLORS.includes(value as any) && (
            <CheckIcon className="w-3 h-3 m-0.5" />
          )}
        </div>
        
        {/* Color Value */}
        <span className="text-sm font-mono text-gray-700">
          {value || placeholder}
        </span>
      </button>

      {/* Color Picker Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 p-3 min-w-[240px]">
          {/* Predefined Colors */}
          {showPalette && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Preset Colors
              </label>
              <div className="grid grid-cols-6 gap-1">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={cn(
                      'w-8 h-8 rounded border-2 transition-all',
                      'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500',
                      value === color ? 'border-gray-900' : 'border-gray-300'
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color}`}
                  >
                    {value === color && (
                      <CheckIcon 
                        className="w-4 h-4 mx-auto" 
                        style={{ color: getContrastingTextColor(color) }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Color Input */}
          {allowCustom && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Custom Color
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="#3b82f6"
                  className={cn(
                    'flex-1 px-2 py-1 text-sm border rounded font-mono',
                    'focus:outline-none focus:ring-1 focus:ring-blue-500',
                    isValidCustom ? 'border-gray-300' : 'border-red-300'
                  )}
                />
                <button
                  type="button"
                  onClick={handleCustomColorSubmit}
                  disabled={!isValidCustom || !customValue}
                  className={cn(
                    'px-3 py-1 text-xs bg-blue-600 text-white rounded',
                    'hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500',
                    'disabled:bg-gray-300 disabled:cursor-not-allowed'
                  )}
                >
                  Apply
                </button>
              </div>
              {!isValidCustom && customValue && (
                <p className="text-xs text-red-600 mt-1">
                  Please enter a valid hex color (e.g., #3b82f6)
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
