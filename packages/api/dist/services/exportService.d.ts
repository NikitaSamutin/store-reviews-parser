import { Review } from '../types/index.js';
export type ExportResult = {
    filename: string;
    contentType: string;
    content: string;
};
export declare class ExportService {
    exportToCSV(reviews: Review[], filename?: string): Promise<ExportResult>;
    exportToJSON(reviews: Review[], filename?: string): Promise<ExportResult>;
}
//# sourceMappingURL=exportService.d.ts.map