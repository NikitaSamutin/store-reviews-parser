import { Review } from '../types';
export declare class ExportService {
    exportToCSV(reviews: Review[], filename?: string): Promise<string>;
    exportToJSON(reviews: Review[], filename?: string): Promise<string>;
    getExportedFiles(): string[];
    deleteExportedFile(filePath: string): boolean;
}
//# sourceMappingURL=exportService.d.ts.map