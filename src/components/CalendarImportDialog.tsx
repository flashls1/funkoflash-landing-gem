import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, AlertCircle, CheckCircle, FileText, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parse } from 'date-fns';
import { commitWeekendMatrix, WeekendMatrixEvent } from '@/hooks/useWeekendMatrixCommit';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'en' | 'es';
  selectedTalent?: string;
  onImportComplete: () => void;
}

interface ImportRow {
  [key: string]: any;
  _rowIndex: number;
  _validationErrors: string[];
}

export const CalendarImportDialog = ({ open, onOpenChange, language, selectedTalent, onImportComplete }: ImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ImportRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'results'>('upload');
  const [dryRunResults, setDryRunResults] = useState<any>(null);
  const [commitResults, setCommitResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [importTalent, setImportTalent] = useState(selectedTalent || '');
  const [importYear, setImportYear] = useState(new Date().getFullYear());
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [talents, setTalents] = useState<{ id: string; name: string }[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>(['event_title', 'start_date']); // Default to standard CSV
  const [importFormat, setImportFormat] = useState<'standard' | 'weekend-matrix'>('standard');
  const [fallbackRule, setFallbackRule] = useState<'sat-sun' | 'fri-sat-sun'>('sat-sun');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load talents on component mount
  useEffect(() => {
    const loadTalents = async () => {
      const { data } = await supabase
        .from('talent_profiles')
        .select('id, name')
        .eq('active', true)
        .order('name');
      
      if (data) {
        setTalents(data);
        // If no talent selected and there are talents, select the first one
        if (!importTalent && data.length > 0) {
          setImportTalent(data[0].id);
        }
      }
    };
    
    if (open) {
      loadTalents();
    }
  }, [open, importTalent]);

  const content = {
    en: {
      title: 'Import Calendar Events',
      upload: 'Upload File',
      mapping: 'Map Columns',
      preview: 'Preview Import',
      results: 'Import Results',
      uploadDesc: 'Upload a CSV or Excel file with your calendar events',
      chooseFile: 'Choose File',
      next: 'Next',
      back: 'Back',
      dryRun: 'Dry Run',
      commit: 'Commit Import',
      required: 'Required',
      optional: 'Optional',
      preview50: 'Preview (first 50 rows)',
      summary: 'Summary',
      toBeCreated: 'To be created',
      toBeUpdated: 'To be updated',
      toBeSkipped: 'To be skipped',
      validationErrors: 'Validation errors',
      importComplete: 'Import completed successfully!',
      close: 'Close',
      talent: 'Talent',
      selectTalent: 'Select talent',
      year: 'Year',
      importMode: 'Import Mode',
      merge: 'Merge (add/update)',
      replace: 'Replace entire year',
      replaceWarning: '⚠️ This will DELETE ALL events for the selected year for this talent',
      format: {
        title: 'Import Format',
        standard: 'Standard table (existing)',
        weekendMatrix: 'Weekend matrix (Fri/Sat/Sun)'
      },
      options: {
        yearLabel: 'Year',
        mode: {
          merge: 'Merge',
          replaceYear: 'Replace Year (danger)'
        },
        fallback: {
          label: 'If XLSX styles are missing…',
          satSun: 'Assume Sat–Sun only',
          friSatSun: 'Assume Fri–Sun'
        }
      },
      previewHeaders: {
        month: 'Month',
        status: 'Status'
      },
      errors: {
        missingTitle: 'Missing event title',
        missingDay: 'No day in Fri/Sat/Sun',
        yearMismatch: 'Row month/year doesn\'t match the selected year'
      },
      warnings: {
        autofilledTitle: 'Autofilled title: Available'
      }
    },
    es: {
      title: 'Importar Eventos de Calendario',
      upload: 'Subir Archivo',
      mapping: 'Mapear Columnas',
      preview: 'Vista Previa',
      results: 'Resultados',
      uploadDesc: 'Sube un archivo CSV o Excel con tus eventos de calendario',
      chooseFile: 'Elegir Archivo',
      next: 'Siguiente',
      back: 'Atrás',
      dryRun: 'Prueba sin Guardar',
      commit: 'Confirmar Importación',
      required: 'Requerido',
      optional: 'Opcional',
      preview50: 'Vista previa (primeras 50 filas)',
      summary: 'Resumen',
      toBeCreated: 'A crear',
      toBeUpdated: 'A actualizar',
      toBeSkipped: 'A omitir',
      validationErrors: 'Errores de validación',
      importComplete: '¡Importación completada exitosamente!',
      close: 'Cerrar',
      talent: 'Talento',
      selectTalent: 'Seleccionar talento',
      year: 'Año',
      importMode: 'Modo de Importación',
      merge: 'Combinar (agregar/actualizar)',
      replace: 'Reemplazar año completo',
      replaceWarning: '⚠️ Esto eliminará TODOS los eventos del año seleccionado para este talento',
      format: {
        title: 'Formato de Importación',
        standard: 'Tabla estándar (existente)',
        weekendMatrix: 'Matriz de fin de semana (Vie/Sáb/Dom)'
      },
      options: {
        yearLabel: 'Año',
        mode: {
          merge: 'Combinar',
          replaceYear: 'Reemplazar año (peligro)'
        },
        fallback: {
          label: 'Si faltan estilos del XLSX…',
          satSun: 'Asumir solo Sáb–Dom',
          friSatSun: 'Asumir Vie–Sáb–Dom'
        }
      },
      previewHeaders: {
        month: 'Mes',
        status: 'Estado'
      },
      errors: {
        missingTitle: 'Falta el título del evento',
        missingDay: 'No hay día en Vie/Sáb/Dom',
        yearMismatch: 'El mes/año de la fila no coincide con el año seleccionado'
      },
      warnings: {
        autofilledTitle: 'Título autocompletado: Disponible'
      }
    }
  };

  const t = content[language];

  // Function to process Weekend Matrix (Fri/Sat/Sun) format from XLSX
  const processWeekendMatrix = (workbook: any, selectedYear: number, fallbackRule: 'sat-sun' | 'fri-sat-sun'): any[] => {
    const events: any[] = [];
    let currentMonth = '';
    let currentYear = '';
    
    console.log('Starting to process Weekend Matrix data for year:', selectedYear);
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert sheet to range to get raw cell data with styles
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');
    
    for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex++) {
      const row: any[] = [];
      const cellStyles: any[] = [];
      
      // Read cells for this row
      for (let colIndex = range.s.c; colIndex <= Math.min(range.e.c, 5); colIndex++) { // Only read first 6 columns (A-F)
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        const cell = worksheet[cellRef];
        row[colIndex] = cell ? (cell.w || cell.v || '') : '';
        cellStyles[colIndex] = cell ? cell.s : null;
      }
      
      if (row.length === 0) continue;
      
      const firstCell = String(row[0] || '').trim();
      
      // Check if this is a month/year header row (like "January 2025")
      const monthMatch = firstCell.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i);
      if (monthMatch) {
        currentMonth = monthMatch[1];
        currentYear = monthMatch[2];
        console.log(`Found month header: ${currentMonth} ${currentYear}`);
        
        // Skip if not the selected year
        if (parseInt(currentYear) !== selectedYear) {
          console.log(`Skipping month ${currentMonth} ${currentYear} - not selected year ${selectedYear}`);
          currentMonth = '';
          currentYear = '';
        }
        continue;
      }
      
      // Skip column header rows
      if (firstCell.toLowerCase().includes('friday') || 
          firstCell.toLowerCase().includes('saturday') || 
          firstCell.toLowerCase().includes('sunday') ||
          firstCell.toLowerCase().includes('event') ||
          firstCell.toLowerCase().includes('location')) {
        console.log('Skipping header row:', firstCell);
        continue;
      }
      
      // Process event rows
      if (currentMonth && currentYear && row.length >= 6) {
        const statusCell = firstCell; // "BOOKED: $25,000" or "Booked", etc.
        const fridayCell = String(row[1] || '').trim();
        const saturdayCell = String(row[2] || '').trim(); 
        const sundayCell = String(row[3] || '').trim();
        const eventTitleRaw = String(row[4] || '').trim();
        const locationCell = String(row[5] || '').trim();
        
        // Extract numeric dates
        const fridayDate = fridayCell.replace(/\D/g, '');
        const saturdayDate = saturdayCell.replace(/\D/g, '');
        const sundayDate = sundayCell.replace(/\D/g, '');
        
        // Check if we have any day values
        const hasFri = !!fridayDate;
        const hasSat = !!saturdayDate;
        const hasSun = !!sundayDate;
        
        console.log(`Processing row ${rowIndex + 1}: Status="${statusCell}" | Fri="${fridayCell}" | Sat="${saturdayCell}" | Sun="${sundayCell}" | Title="${eventTitleRaw}" | Location="${locationCell}"`);
        
        // Determine event title and status
        let eventTitle = eventTitleRaw;
        let isAutofilled = false;
        
        // Auto-generate title for Available events when Column E is blank but there are day values
        if (!eventTitleRaw && (hasFri || hasSat || hasSun)) {
          eventTitle = language === 'es' ? 'Disponible' : 'Available';
          isAutofilled = true;
        }
        
        // If title is present or autofilled, create event
        if (eventTitle) {
          // Determine Friday inclusion based on cell background color
          let includeFriday = false;
          const fridayStyle = cellStyles[1]; // Column B (Friday)
          
          if (fridayStyle && fridayStyle.fgColor) {
            // If Friday cell has any fill color, include Friday
            const fillColor = fridayStyle.fgColor;
            const isWhiteOrEmpty = !fillColor || 
              fillColor.rgb === 'FFFFFF' || 
              fillColor.rgb === 'ffffff' ||
              fillColor.theme === 0;
            includeFriday = !isWhiteOrEmpty;
          } else {
            // Fallback if no style info
            includeFriday = fallbackRule === 'fri-sat-sun';
          }
          
          console.log(`Friday inclusion for "${eventTitle}": ${includeFriday} (style: ${JSON.stringify(fridayStyle)})`);
          
          // Build dates array
          const dates: string[] = [];
          if (includeFriday && fridayDate) {
            dates.push(`${currentYear}-${getMonthNumber(currentMonth)}-${fridayDate.padStart(2, '0')}`);
          }
          if (saturdayDate) {
            dates.push(`${currentYear}-${getMonthNumber(currentMonth)}-${saturdayDate.padStart(2, '0')}`);
          }
          if (sundayDate) {
            dates.push(`${currentYear}-${getMonthNumber(currentMonth)}-${sundayDate.padStart(2, '0')}`);
          }
          
          if (dates.length > 0) {
            // Determine status
            let status = 'available';
            let notesInternal = '';
            
            // If title was autofilled, force status to available
            if (isAutofilled) {
              status = 'available';
            } else if (statusCell) {
              const statusLower = statusCell.toLowerCase();
              if (statusLower.includes('booked') || statusLower.startsWith('booked:')) {
                status = 'booked';
                // Extract income if present
                const incomeMatch = statusCell.match(/\$[\d,]+/);
                if (incomeMatch) {
                  notesInternal = `Income: ${incomeMatch[0]}`;
                }
              } else if (statusLower.includes('hold')) {
                status = 'hold';
              } else if (statusLower.includes('tentative')) {
                status = 'tentative';
              } else if (statusLower.includes('cancelled') || statusLower.includes('canceled')) {
                status = 'cancelled';
              } else if (['personal', 'ooo', 'out of office', 'unavailable', 'not available'].some(term => statusLower.includes(term))) {
                status = 'not_available';
              }
              
              // If status doesn't match known patterns, include raw status in notes
              if (!['booked', 'hold', 'tentative', 'cancelled', 'available', 'not_available'].includes(status) && statusCell) {
                notesInternal = statusCell;
                status = 'booked'; // Default assumption
              }
            }
            
            // Parse location
            let city = '', state = '', country = 'USA';
            const addressLine = locationCell;
            
            if (locationCell) {
              const parts = locationCell.split(',').map(p => p.trim());
              if (parts.length === 1) {
                city = parts[0];
              } else if (parts.length === 2) {
                city = parts[0];
                state = parts[1];
              } else if (parts.length >= 3) {
                city = parts.slice(0, -2).join(', ');
                state = parts[parts.length - 2];
                country = parts[parts.length - 1];
              }
            }
            
            // Create event
            const startDate = dates[0];
            const endDate = dates[dates.length - 1];
            
            events.push({
              event_title: eventTitle,
              start_date: startDate,
              end_date: endDate,
              status: status,
              venue_name: eventTitle,
              location_city: city,
              location_state: state,
              location_country: country,
              address_line: addressLine,
              notes_internal: notesInternal,
              notes_public: status === 'available' ? 'Available for booking' : '',
              all_day: true,
              timezone: 'America/Los_Angeles',
              source_file: 'weekend-matrix-import',
              source_row_id: `row-${rowIndex + 1}`,
              _isWeekendMatrix: true,
              _rowIndex: rowIndex + 1,
              _validationErrors: isAutofilled ? [`warning:${language === 'es' ? 'Título autocompletado: Disponible' : 'Autofilled title: Available'}`] : []
            });
            
            console.log(`Created event: ${eventTitle} from ${startDate} to ${endDate} (${status})`);
          }
        } else if (!hasFri && !hasSat && !hasSun) {
          // No title and no days - skip row silently (header/blank)
          console.log(`Skipping empty row ${rowIndex + 1}`);
        }
      }
    }
    
    console.log(`Processed Weekend Matrix: ${events.length} events created`);
    return events;
  };

  const getMonthNumber = (monthName: string): string => {
    const months: { [key: string]: string } = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };
    return months[monthName.toLowerCase()] || '01';
  };

  // Update required fields when headers change
  useEffect(() => {
    if (headers.length === 0) {
      setRequiredFields(['event_title', 'start_date']); // Default for empty headers
      return;
    }

    // Check if this is Google Sheets format by looking at headers
    const hasWeekdayColumns = ['Friday', 'Saturday', 'Sunday'].every(day => 
      headers.some(header => header && typeof header === 'string' && header.toLowerCase().includes(day.toLowerCase()))
    );
    
    if (hasWeekdayColumns) {
      // For Google Sheets format, only event_title is required (dates are auto-generated)
      console.log('Google Sheets format detected - only requiring event_title');
      setRequiredFields(['event_title']);
    } else {
      // For standard CSV, both event_title and start_date are required
      console.log('Standard CSV format - requiring event_title and start_date');
      setRequiredFields(['event_title', 'start_date']);
    }
  }, [headers]);
  const optionalFields = ['end_date', 'talent_name', 'status', 'start_time', 'end_time', 'timezone', 'all_day', 'venue_name',
    'location_city', 'location_state', 'location_country', 'address_line', 'contact_name', 
    'contact_email', 'contact_phone', 'url', 'notes_internal', 'notes_public', 'travel_in', 'travel_out'];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    // Enhanced file type validation - Google Sheets exports may not have proper MIME types
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/csv',
      'text/plain',
      'application/octet-stream', // Sometimes Google Sheets exports as this
      '', // Some browsers don't set MIME type properly
      'application/x-csv'
    ];
    
    const fileExtension = uploadedFile.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['csv', 'xlsx', 'xls'];
    
    // More lenient validation - prioritize file extension over MIME type
    if (!allowedExtensions.includes(fileExtension || '')) {
      toast({
        title: 'Invalid file format',
        description: 'Please upload a CSV or Excel file (.csv, .xlsx, .xls). File must have proper extension.',
        variant: 'destructive'
      });
      return;
    }

    setFile(uploadedFile);
    setLoading(true);

    try {
      // Handle file processing based on format
      if (importFormat === 'weekend-matrix') {
        // Weekend Matrix format - only process XLSX
        if (fileExtension !== 'xlsx') {
          toast({
            title: 'Invalid file format for Weekend Matrix',
            description: 'Weekend Matrix format requires XLSX files only.',
            variant: 'destructive'
          });
          return;
        }
        
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { 
          type: 'array',
          cellDates: true,
          cellNF: false,
          cellText: false,
          cellStyles: true // Enable style reading for cell colors
        });
        
        const processedEvents = processWeekendMatrix(workbook, importYear, fallbackRule);
        if (processedEvents.length > 0) {
          setHeaders(['event_title', 'start_date', 'end_date', 'venue_name', 'location_city', 'status', 'notes_internal', 'notes_public', 'all_day']);
          setData(processedEvents);
          setStep('mapping');
          
          // Auto-map for Weekend Matrix format
          setMapping({
            event_title: 'event_title',
            start_date: 'start_date', 
            end_date: 'end_date',
            venue_name: 'venue_name',
            location_city: 'location_city',
            status: 'status',
            notes_internal: 'notes_internal',
            notes_public: 'notes_public',
            all_day: 'all_day'
          });
          return;
        }
      } else {
        // Standard format processing
        let jsonData: any[];
        
        if (fileExtension === 'csv' || uploadedFile.type === 'text/csv' || uploadedFile.type === 'application/csv') {
          // Enhanced CSV parsing with better error handling
          const text = await uploadedFile.text();
          if (!text || text.trim().length === 0) throw new Error('Empty or invalid CSV file');
          
          // Split lines and handle different line endings (Windows, Mac, Unix)
          const lines = text.split(/\r?\n|\r/).filter(line => line.trim().length > 0);
          if (lines.length === 0) throw new Error('No valid data found in CSV file');
          
          console.log(`Processing CSV with ${lines.length} lines`);
          
          // Parse CSV with proper comma handling (including quoted commas)
          const parseCSVLine = (line: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            
            result.push(current.trim()); // Add the last field
            return result.map(field => field.replace(/^"|"$/g, '')); // Remove surrounding quotes
          };
          
          const headers = parseCSVLine(lines[0]);
          const rows = lines.slice(1).map(line => {
            const values = parseCSVLine(line);
            // Ensure each row has the same number of columns as headers
            return headers.map((_, i) => values[i] || '');
          });
          
          jsonData = [headers, ...rows];
          console.log(`CSV parsed: ${headers.length} columns, ${rows.length} data rows`);
          
        } else {
          // Handle Excel files with enhanced error handling
          console.log('Processing Excel file...');
          const arrayBuffer = await uploadedFile.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { 
            type: 'array',
            cellDates: true,
            cellNF: false,
            cellText: false
          });
          
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('No sheets found in Excel file');
          }
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          
          console.log(`Excel parsed: ${jsonData.length} total rows`);
        }

        if (jsonData.length > 0) {
          const headers = (jsonData[0] as any[]).map(h => String(h || '').trim()); // Ensure all headers are strings
          const rows = jsonData.slice(1).map((row: any, index) => ({
            ...Object.fromEntries(headers.map((header, i) => [header, row[i] || ''])),
            _rowIndex: index + 2,
            _validationErrors: []
          }));

          setHeaders(headers);
          setData(rows);
          setStep('mapping');

          // Smart auto-detection with Google Sheets calendar special handling
          const autoMapping: Record<string, string> = {};
          
          // Check if this is a Google Sheets calendar format
          const hasWeekdayColumns = ['Friday', 'Saturday', 'Sunday'].every(day => 
            headers.some(header => header.toLowerCase().includes(day.toLowerCase()))
          );
          
          if (hasWeekdayColumns) {
            console.log('Detected Google Sheets calendar format - using special mapping');
            // For Google Sheets format, we'll handle start/end dates in processing
            // Don't map individual day columns to start_date
            headers.forEach(header => {
              if (!header || typeof header !== 'string' || header.trim() === '') return;
              
              const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
              const headerWords = header.toLowerCase().split(/[^a-z0-9]+/);
              
              // Event/Title detection
              if (['title', 'event', 'name', 'show', 'convention', 'con'].some(word => 
                normalized.includes(word) || headerWords.includes(word))) {
                autoMapping[header] = 'event_title';
              }
              // Status detection
              else if (['status', 'state', 'availability', 'booked'].some(word => 
                normalized.includes(word) || headerWords.includes(word))) {
                autoMapping[header] = 'status';
              }
              // Location detection
              else if (['location', 'city', 'venue', 'place'].some(word => 
                normalized.includes(word) || headerWords.includes(word))) {
                autoMapping[header] = 'location_city';
              }
              // Skip Friday/Saturday/Sunday columns - they'll be processed automatically
            });
          } else {
            // Standard auto-mapping for normal CSV files
            headers.forEach(header => {
              // Ensure header is a string and has content
              if (!header || typeof header !== 'string' || header.trim() === '') return;
              
              const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
              const headerWords = header.toLowerCase().split(/[^a-z0-9]+/);
              
              // Talent/Artist detection
              if (['talent', 'artist', 'performer', 'voice', 'actor', 'name'].some(word => 
                normalized.includes(word) || headerWords.includes(word))) {
                autoMapping[header] = 'talent_name';
              }
              
              // Event title detection  
              else if (['title', 'event', 'show', 'convention', 'con', 'project'].some(word => 
                normalized.includes(word) || headerWords.includes(word))) {
                autoMapping[header] = 'event_title';
              }
              
              // Start date detection
              else if (['startdate', 'start', 'datestart', 'begindate', 'from'].some(word => 
                normalized.includes(word) || headerWords.includes(word)) && 
                ['date', 'day', 'when'].some(word => normalized.includes(word) || headerWords.includes(word))) {
                autoMapping[header] = 'start_date';
              }
              
              // End date detection
              else if (['enddate', 'end', 'dateend', 'finishdate', 'to', 'until'].some(word => 
                normalized.includes(word) || headerWords.includes(word)) && 
                ['date', 'day', 'when'].some(word => normalized.includes(word) || headerWords.includes(word))) {
                autoMapping[header] = 'end_date';
              }
              
              // Status detection
              else if (['status', 'state', 'condition', 'booking'].some(word => 
                normalized.includes(word) || headerWords.includes(word))) {
                autoMapping[header] = 'status';
              }
              
              // Venue detection
              else if (['venue', 'location', 'place', 'site', 'facility'].some(word => 
                normalized.includes(word) || headerWords.includes(word))) {
                autoMapping[header] = 'venue_name';
              }
              
              // City detection
              else if (['city', 'town'].some(word => 
                normalized.includes(word) || headerWords.includes(word))) {
                autoMapping[header] = 'location_city';
              }
              
              // State detection
              else if (['state', 'province', 'region'].some(word => 
                normalized.includes(word) || headerWords.includes(word))) {
                autoMapping[header] = 'location_state';
              }
              
              // URL/Website detection
              else if (['url', 'website', 'link', 'web'].some(word => 
                normalized.includes(word) || headerWords.includes(word))) {
                autoMapping[header] = 'url';
              }
              
              // Notes detection
              else if (['notes', 'note', 'comment', 'description', 'info'].some(word => 
                normalized.includes(word) || headerWords.includes(word))) {
                autoMapping[header] = 'notes_public';
              }
            });
          }
          setMapping(autoMapping);
        }
      }
      } catch (error: any) {
        console.error('File processing error details:', {
          error: error.message,
          fileType: uploadedFile.type,
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size,
          fileExtension
        });
        
        toast({
          title: 'Error reading file',
          description: `File processing failed: ${error.message}. Please ensure it's a valid CSV or Excel file.`,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
  };

  const validateAndNormalizeData = (rows: ImportRow[]) => {
    return rows.map(row => {
      const mappedRow: any = { _rowIndex: row._rowIndex, _validationErrors: [] };
      
      // Apply mapping
      Object.entries(mapping).forEach(([header, field]) => {
        if (field && row[header] !== undefined) {
          mappedRow[field] = row[header];
        }
      });

      // Check if this is Google Sheets format (has Friday/Saturday/Sunday columns)
      const hasWeekdayColumns = Object.keys(row).some(key => 
        key && typeof key === 'string' && ['friday', 'saturday', 'sunday'].includes(key.toLowerCase())
      );

      if (hasWeekdayColumns) {
        // For Google Sheets format, skip start_date validation 
        // since we'll generate it from weekday columns
        const nonDateRequiredFields = ['event_title']; // Only require event_title for Google Sheets
        
        nonDateRequiredFields.forEach(field => {
          if (!mappedRow[field] || mappedRow[field].toString().trim() === '') {
            mappedRow._validationErrors.push(`Missing ${field}`);
          }
        });
        
        // Don't validate start_date/end_date for Google Sheets - they'll be generated
      } else {
        // Standard validation for normal CSV files
        const standardRequiredFields = ['event_title', 'start_date'];
        standardRequiredFields.forEach(field => {
          if (!mappedRow[field] || mappedRow[field].toString().trim() === '') {
            mappedRow._validationErrors.push(`Missing ${field}`);
          }
        });

        // Set defaults for missing end_date
        if (!mappedRow.end_date && mappedRow.start_date) {
          mappedRow.end_date = mappedRow.start_date; // Default to same day if end date not provided
        }
      }

      // Set default talent if not specified and one is selected
      if (!mappedRow.talent_name && importTalent) {
        // We'll use the selected talent from the UI
        const selectedTalentData = talents.find(t => t.id === importTalent);
        if (selectedTalentData) {
          mappedRow.talent_name = selectedTalentData.name;
        }
      }

      // Normalize status
      if (mappedRow.status) {
        const normalizedStatus = mappedRow.status.toLowerCase();
        if (['booked', 'confirmed'].includes(normalizedStatus)) mappedRow.status = 'booked';
        else if (['hold', 'pending'].includes(normalizedStatus)) mappedRow.status = 'hold';
        else if (['available', 'open'].includes(normalizedStatus)) mappedRow.status = 'available';
        else if (['tentative', 'maybe'].includes(normalizedStatus)) mappedRow.status = 'tentative';
        else if (['cancelled', 'canceled'].includes(normalizedStatus)) mappedRow.status = 'cancelled';
        else if (['not available', 'unavailable', 'ooo', 'off', 'personal day', 'out of office'].includes(normalizedStatus)) mappedRow.status = 'not_available';
        else mappedRow.status = 'available'; // default
      } else {
        mappedRow.status = 'available'; // default
      }

      return mappedRow;
    });
  };

  const handleDryRun = async () => {
    setLoading(true);
        const validatedData = validateAndNormalizeData(data);
        
        const summary = {
          toBeCreated: validatedData.filter(row => row._validationErrors.filter((err: string) => !err.startsWith('warning:')).length === 0).length,
          toBeSkipped: validatedData.filter(row => row._validationErrors.filter((err: string) => !err.startsWith('warning:')).length > 0).length,
          validationErrors: validatedData.filter(row => row._validationErrors.filter((err: string) => !err.startsWith('warning:')).length > 0).length
        };

    setDryRunResults({ summary, data: validatedData.slice(0, 50) });
    setStep('preview');
    setLoading(false);
  };

  const handleCommit = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      if (importFormat === 'weekend-matrix') {
        // Weekend Matrix commit via edge function
        const validatedData = validateAndNormalizeData(data);
        const validRows = validatedData.filter(row => row._validationErrors.filter((err: string) => !err.startsWith('warning:')).length === 0);
        
        // Transform data to match WeekendMatrixEvent interface
        const events: WeekendMatrixEvent[] = validRows.map(row => ({
          talent_id: importTalent,
          event_title: row.event_title,
          status: row.status || 'available',
          all_day: true,
          timezone: row.timezone || 'America/Los_Angeles',
          start_date: row.start_date,
          end_date: row.end_date,
          venue_name: row.venue_name || null,
          location_city: row.location_city || null,
          location_state: row.location_state || null,
          location_country: row.location_country || 'USA',
          address_line: row.address_line || null,
          notes_public: row.notes_public || null,
          notes_internal: row.notes_internal || null,
          source_file: file?.name || 'weekend-matrix-import',
          source_row_id: row.source_row_id || null
        }));

        const result = await commitWeekendMatrix({
          talentId: importTalent,
          year: importYear,
          mode: importMode,
          events
        });

        setCommitResults({
          created: result.counts.created,
          updated: result.counts.updated,
          skipped: result.counts.skipped,
          failed: result.counts.failed,
          errors: result.errors
        });
        
        setStep('results');
        
        toast({
          title: t.importComplete,
          description: `${result.counts.created} events imported successfully. ${result.counts.failed > 0 ? `${result.counts.failed} failed.` : ''}`
        });

      } else {
        // Standard CSV/Excel import (existing logic)
        const validatedData = validateAndNormalizeData(data);
        const validRows = validatedData.filter(row => row._validationErrors.filter((err: string) => !err.startsWith('warning:')).length === 0);

        // First get talent profiles for mapping names to IDs
        const { data: talents } = await supabase
          .from('talent_profiles')
          .select('id, name');

        const talentMap = new Map(talents?.map(t => [t.name.toLowerCase(), t.id]) || []);

        const rowsToInsert = validRows.map(row => ({
          talent_id: importTalent || talentMap.get(row.talent_name?.toLowerCase()) || null,
          event_title: row.event_title,
          start_date: row.start_date,
          end_date: row.end_date,
          start_time: row.start_time || null,
          end_time: row.end_time || null,
          timezone: row.timezone || 'America/Chicago',
          all_day: !row.start_time && !row.end_time,
          status: row.status,
          venue_name: row.venue_name || null,
          location_city: row.location_city || null,
          location_state: row.location_state || null,
          location_country: row.location_country || 'USA',
          address_line: row.address_line || null,
          contact_name: row.contact_name || null,
          contact_email: row.contact_email || null,
          contact_phone: row.contact_phone || null,
          url: row.url || null,
          notes_internal: row.notes_internal || null,
          notes_public: row.notes_public || null,
          travel_in: row.travel_in || null,
          travel_out: row.travel_out || null,
          source_file: file?.name || 'import',
          created_by: user.id
        }));

        const { data: insertedData, error } = await supabase
          .from('calendar_event')
          .insert(rowsToInsert)
          .select();

        if (error) throw error;

        setCommitResults({
          created: insertedData?.length || 0,
          skipped: validatedData.length - validRows.length
        });
        setStep('results');
        
        toast({
          title: t.importComplete,
          description: `${insertedData?.length || 0} events imported successfully.`
        });
      }

      onImportComplete();
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: error.message || 'Please check your data and try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setData([]);
    setHeaders([]);
    setMapping({});
    setStep('upload');
    setDryRunResults(null);
    setCommitResults(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetDialog();
    }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>
            {step === 'upload' && t.uploadDesc}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">{t.upload}</TabsTrigger>
            <TabsTrigger value="mapping" disabled={!file}>{t.mapping}</TabsTrigger>
            <TabsTrigger value="preview" disabled={!dryRunResults}>{t.preview}</TabsTrigger>
            <TabsTrigger value="results" disabled={!commitResults}>{t.results}</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            {/* Import Format Selection */}
            <div className="space-y-3">
              <Label>{t.format.title}</Label>
              <RadioGroup value={importFormat} onValueChange={(value: 'standard' | 'weekend-matrix') => setImportFormat(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard" className="cursor-pointer">{t.format.standard}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekend-matrix" id="weekend-matrix" />
                  <Label htmlFor="weekend-matrix" className="cursor-pointer flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t.format.weekendMatrix}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Weekend Matrix Options */}
            {importFormat === 'weekend-matrix' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Weekend Matrix Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t.options.yearLabel}</Label>
                      <Select value={importYear.toString()} onValueChange={(value) => setImportYear(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2025">2025</SelectItem>
                          <SelectItem value="2026">2026</SelectItem>
                          <SelectItem value="2027">2027</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t.importMode}</Label>
                      <Select value={importMode} onValueChange={(value: 'merge' | 'replace') => setImportMode(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="merge">{t.options.mode.merge}</SelectItem>
                          <SelectItem value="replace">{t.options.mode.replaceYear}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">{t.options.fallback.label}</Label>
                    <RadioGroup value={fallbackRule} onValueChange={(value: 'sat-sun' | 'fri-sat-sun') => setFallbackRule(value)} className="mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sat-sun" id="sat-sun" />
                        <Label htmlFor="sat-sun" className="text-sm cursor-pointer">{t.options.fallback.satSun}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fri-sat-sun" id="fri-sat-sun" />
                        <Label htmlFor="fri-sat-sun" className="text-sm cursor-pointer">{t.options.fallback.friSatSun}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Talent Selection */}
            <div className="space-y-2">
              <Label htmlFor="talent-select">{t.talent}</Label>
              <Select value={importTalent} onValueChange={setImportTalent}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectTalent} />
                </SelectTrigger>
                <SelectContent>
                  {talents.map(talent => (
                    <SelectItem key={talent.id} value={talent.id}>
                      {talent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!importTalent && (
                <p className="text-sm text-destructive">Please select a talent before importing calendar data.</p>
              )}
            </div>

            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="text-lg font-medium mb-2">{t.chooseFile}</div>
              <div className="text-sm text-muted-foreground">
                {importFormat === 'weekend-matrix' ? 'Excel (.xlsx) only' : 'CSV or Excel (.xlsx)'}
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                accept={importFormat === 'weekend-matrix' ? '.xlsx' : '.csv,.xlsx,.xls'}
                onChange={handleFileUpload}
                className="hidden"
                disabled={!importTalent}
              />
            </div>
            {file && (
              <div className="text-center">
                <FileText className="inline mr-2" />
                {file.name} ({Math.round(file.size / 1024)}KB)
              </div>
            )}
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">{t.required}</h3>
                {requiredFields.map(field => (
                  <div key={field} className="mb-2">
                    <Label className="text-sm">{field.replace('_', ' ')}</Label>
                    <Select value={mapping[headers.find(h => mapping[h] === field) || ''] || ''} 
                            onValueChange={(value) => {
                              const newMapping = { ...mapping };
                              Object.keys(newMapping).forEach(key => {
                                if (newMapping[key] === field) delete newMapping[key];
                              });
                              if (value && value !== "no-mapping") newMapping[value] = field;
                              setMapping(newMapping);
                            }}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select column for ${field}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map(header => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-medium mb-3">{t.optional}</h3>
                <div className="max-h-64 overflow-y-auto">
                  {optionalFields.map(field => (
                    <div key={field} className="mb-2">
                      <Label className="text-sm text-muted-foreground">{field.replace('_', ' ')}</Label>
                      <Select value={mapping[headers.find(h => mapping[h] === field) || ''] || ''} 
                              onValueChange={(value) => {
                                const newMapping = { ...mapping };
                                Object.keys(newMapping).forEach(key => {
                                  if (newMapping[key] === field) delete newMapping[key];
                                });
                                if (value && value !== "no-mapping") newMapping[value] = field;
                                setMapping(newMapping);
                              }}>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select column for ${field}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-mapping">No mapping</SelectItem>
                          {headers.map(header => (
                            <SelectItem key={header} value={header}>{header}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>{t.back}</Button>
              <Button onClick={handleDryRun} disabled={loading || requiredFields.some(field => 
                !headers.some(header => mapping[header] === field)
              )}>
                {loading ? 'Processing...' : t.dryRun}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {dryRunResults && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{t.summary}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-4">
                    <Badge variant="default">{t.toBeCreated}: {dryRunResults.summary.toBeCreated}</Badge>
                    <Badge variant="secondary">{t.toBeSkipped}: {dryRunResults.summary.toBeSkipped}</Badge>
                    {dryRunResults.summary.validationErrors > 0 && (
                      <Badge variant="destructive">{t.validationErrors}: {dryRunResults.summary.validationErrors}</Badge>
                    )}
                  </CardContent>
                </Card>

                <div>
                  <h3 className="font-medium mb-3">{t.preview50}</h3>
                  <div className="border rounded-lg overflow-auto max-h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Event Title</TableHead>
                          <TableHead>Talent</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Issues</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dryRunResults.data.map((row: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{row._rowIndex}</TableCell>
                            <TableCell>
                              {row._validationErrors.length === 0 ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </TableCell>
                            <TableCell>{row.event_title || '-'}</TableCell>
                            <TableCell>{row.talent_name || '-'}</TableCell>
                            <TableCell>{row.start_date || '-'}</TableCell>
                            <TableCell>{row.end_date || '-'}</TableCell>
                            <TableCell>
                              {row._validationErrors.length > 0 && (
                                <span className={`text-sm ${row._validationErrors.some((err: string) => err.startsWith('warning:')) ? 'text-amber-600' : 'text-red-600'}`}>
                                  {row._validationErrors.map((err: string) => err.startsWith('warning:') ? err.replace('warning:', '') : err).join(', ')}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('mapping')}>{t.back}</Button>
                  <Button 
                    onClick={handleCommit} 
                    disabled={loading || dryRunResults.summary.toBeCreated === 0}
                  >
                    {loading ? 'Importing...' : t.commit}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {commitResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    {t.importComplete}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>Created: {commitResults.created} events</div>
                    <div>Skipped: {commitResults.skipped} rows</div>
                  </div>
                  <Button className="mt-4" onClick={() => onOpenChange(false)}>
                    {t.close}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};