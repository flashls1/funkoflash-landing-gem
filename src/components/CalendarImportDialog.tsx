import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

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
      replaceWarning: '⚠️ This will DELETE ALL events for the selected year for this talent'
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
      replaceWarning: '⚠️ Esto eliminará TODOS los eventos del año seleccionado para este talento'
    }
  };

  const t = content[language];

  const requiredFields = ['event_title', 'start_date']; // Only these are truly required
  const optionalFields = ['end_date', 'talent_name', 'status', 'start_time', 'end_time', 'timezone', 'all_day', 'venue_name', 
    'location_city', 'location_state', 'location_country', 'address_line', 'contact_name', 
    'contact_email', 'contact_phone', 'url', 'notes_internal', 'notes_public', 'travel_in', 'travel_out'];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/csv',
      'text/plain'
    ];
    
    const fileExtension = uploadedFile.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['csv', 'xlsx', 'xls'];
    
    if (!allowedTypes.includes(uploadedFile.type) && !allowedExtensions.includes(fileExtension || '')) {
      toast({
        title: 'Invalid file format',
        description: 'Please upload a CSV or Excel file (.csv, .xlsx, .xls)',
        variant: 'destructive'
      });
      return;
    }

    setFile(uploadedFile);
    setLoading(true);

    try {
      let jsonData: any[];
      
      if (fileExtension === 'csv' || uploadedFile.type === 'text/csv') {
        // Handle CSV files
        const text = await uploadedFile.text();
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) throw new Error('Empty file');
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          return headers.map((_, i) => values[i] || '');
        });
        jsonData = [headers, ...rows];
      } else {
        // Handle Excel files
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      }

      if (jsonData.length > 0) {
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1).map((row: any, index) => ({
          ...Object.fromEntries(headers.map((header, i) => [header, row[i] || ''])),
          _rowIndex: index + 2,
          _validationErrors: []
        }));

        setHeaders(headers);
        setData(rows);
        setStep('mapping');

        // Smart auto-detection with multiple pattern matching
        const autoMapping: Record<string, string> = {};
        headers.forEach(header => {
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
        setMapping(autoMapping);
      }
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: 'Error reading file',
        description: 'Please check your file format and try again. Make sure it\'s a valid CSV or Excel file.',
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

      // Validate required fields more flexibly
      requiredFields.forEach(field => {
        if (!mappedRow[field] || mappedRow[field].toString().trim() === '') {
          mappedRow._validationErrors.push(`Missing ${field}`);
        }
      });

      // Set defaults for missing end_date
      if (!mappedRow.end_date && mappedRow.start_date) {
        mappedRow.end_date = mappedRow.start_date; // Default to same day if end date not provided
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
      toBeCreated: validatedData.filter(row => row._validationErrors.length === 0).length,
      toBeSkipped: validatedData.filter(row => row._validationErrors.length > 0).length,
      validationErrors: validatedData.filter(row => row._validationErrors.length > 0).length
    };

    setDryRunResults({ summary, data: validatedData.slice(0, 50) });
    setStep('preview');
    setLoading(false);
  };

  const handleCommit = async () => {
    if (!user) return;
    
    setLoading(true);
    const validatedData = validateAndNormalizeData(data);
    const validRows = validatedData.filter(row => row._validationErrors.length === 0);

    try {
      // First get talent profiles for mapping names to IDs
      const { data: talents } = await supabase
        .from('talent_profiles')
        .select('id, name');

      const talentMap = new Map(talents?.map(t => [t.name.toLowerCase(), t.id]) || []);

      const rowsToInsert = validRows.map(row => ({
        talent_id: talentMap.get(row.talent_name?.toLowerCase()) || null,
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

      onImportComplete();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: 'Please check your data and try again.',
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
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="text-lg font-medium mb-2">{t.chooseFile}</div>
              <div className="text-sm text-muted-foreground">CSV or Excel (.xlsx)</div>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
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
                                <span className="text-sm text-red-600">
                                  {row._validationErrors.join(', ')}
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