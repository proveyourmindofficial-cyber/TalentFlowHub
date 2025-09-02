import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, FileText } from 'lucide-react';
import { exportToCsv, downloadTemplate, parseCsvFile } from '@/lib/export-utils';

interface ImportExportButtonsProps {
  data: any[];
  onImport: (data: any[]) => Promise<void>;
  exportFilename: string;
  templateType: 'jobs' | 'candidates' | 'applications' | 'interviews' | 'offer-letters';
  exportColumns?: { key: string; label: string }[];
  disabled?: boolean;
}

export function ImportExportButtons({
  data,
  onImport,
  exportFilename,
  templateType,
  exportColumns,
  disabled = false
}: ImportExportButtonsProps) {
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const handleExport = () => {
    try {
      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No data available to export",
          variant: "destructive"
        });
        return;
      }

      exportToCsv(data, exportFilename, exportColumns);
      
      toast({
        title: "Success",
        description: `Data exported successfully as ${exportFilename}.csv`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive"
      });
    }
  };

  const handleTemplateDownload = () => {
    try {
      downloadTemplate(templateType);
      toast({
        title: "Success",
        description: "Import template downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download template",
        variant: "destructive"
      });
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    
    try {
      const importData = await parseCsvFile(file);
      
      if (importData.length === 0) {
        toast({
          title: "Empty File",
          description: "The CSV file contains no data",
          variant: "destructive"
        });
        return;
      }

      await onImport(importData);
      
      toast({
        title: "Success",
        description: `Successfully imported ${importData.length} records`
      });
      
      setImportOpen(false);
      
      // Reset file input
      event.target.value = '';
      
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Export Button */}
      <Button
        variant="outline"
        onClick={handleExport}
        disabled={disabled || !data || data.length === 0}
        data-testid="button-export"
      >
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            data-testid="button-import"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileImport}
                disabled={importing}
                data-testid="input-import-file"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Select a CSV file to import. Make sure the columns match the expected format.
              </p>
            </div>
            
            <div className="border-t pt-4">
              <Button
                variant="outline"
                onClick={handleTemplateDownload}
                className="w-full"
                data-testid="button-download-template"
              >
                <FileText className="h-4 w-4 mr-2" />
                Download Import Template
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                Download a template CSV file with the correct format and sample data.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}