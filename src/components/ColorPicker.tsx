import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

const presetColors = [
  'hsl(220, 70%, 50%)', // Blue
  'hsl(280, 70%, 50%)', // Purple
  'hsl(340, 70%, 50%)', // Pink
  'hsl(20, 90%, 50%)',  // Orange
  'hsl(40, 90%, 50%)',  // Yellow
  'hsl(120, 60%, 50%)', // Green
  'hsl(200, 80%, 50%)', // Cyan
  'hsl(320, 80%, 50%)', // Magenta
  'hsl(0, 70%, 50%)',   // Red
  'hsl(260, 80%, 60%)', // Violet
  'hsl(180, 70%, 50%)', // Teal
  'hsl(160, 60%, 45%)', // Emerald
];

export const ColorPicker = ({ color, onChange, label }: ColorPickerProps) => {
  const [inputValue, setInputValue] = useState(color);

  const handleColorChange = (newColor: string) => {
    setInputValue(newColor);
    onChange(newColor);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (value.match(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/)) {
      onChange(value);
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <div className="flex gap-2">
        <div 
          className="w-10 h-10 rounded-md border-2 border-border cursor-pointer flex-shrink-0"
          style={{ backgroundColor: color }}
          onClick={() => {}}
        />
        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="hsl(220, 70%, 50%)"
          className="flex-1"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="grid grid-cols-4 gap-2">
              {presetColors.map((presetColor, index) => (
                <button
                  key={index}
                  className="w-12 h-12 rounded-md border-2 border-border hover:border-primary transition-colors"
                  style={{ backgroundColor: presetColor }}
                  onClick={() => handleColorChange(presetColor)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};