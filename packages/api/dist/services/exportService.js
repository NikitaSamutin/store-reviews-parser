"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const csv_writer_1 = require("csv-writer");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class ExportService {
    async exportToCSV(reviews, filename) {
        try {
            const exportDir = path_1.default.join(__dirname, '../../exports');
            // Создаём директорию если её нет
            if (!fs_1.default.existsSync(exportDir)) {
                fs_1.default.mkdirSync(exportDir, { recursive: true });
            }
            const fileName = filename || `reviews_${Date.now()}.csv`;
            const filePath = path_1.default.join(exportDir, fileName);
            const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
                path: filePath,
                header: [
                    { id: 'id', title: 'ID' },
                    { id: 'appName', title: 'Название приложения' },
                    { id: 'store', title: 'Магазин' },
                    { id: 'rating', title: 'Рейтинг' },
                    { id: 'title', title: 'Заголовок' },
                    { id: 'content', title: 'Содержание' },
                    { id: 'author', title: 'Автор' },
                    { id: 'date', title: 'Дата' },
                    { id: 'region', title: 'Регион' },
                    { id: 'version', title: 'Версия' },
                    { id: 'helpful', title: 'Полезность' }
                ],
                encoding: 'utf8'
            });
            const formattedReviews = reviews.map(review => ({
                ...review,
                store: review.store === 'google' ? 'Google Play' : 'App Store',
                date: review.date.toLocaleDateString('ru-RU')
            }));
            await csvWriter.writeRecords(formattedReviews);
            return filePath;
        }
        catch (error) {
            console.error('Ошибка экспорта в CSV:', error);
            throw error;
        }
    }
    async exportToJSON(reviews, filename) {
        try {
            const exportDir = path_1.default.join(__dirname, '../../exports');
            if (!fs_1.default.existsSync(exportDir)) {
                fs_1.default.mkdirSync(exportDir, { recursive: true });
            }
            const fileName = filename || `reviews_${Date.now()}.json`;
            const filePath = path_1.default.join(exportDir, fileName);
            const exportData = {
                exportDate: new Date().toISOString(),
                totalReviews: reviews.length,
                reviews: reviews
            };
            fs_1.default.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf8');
            return filePath;
        }
        catch (error) {
            console.error('Ошибка экспорта в JSON:', error);
            throw error;
        }
    }
    getExportedFiles() {
        try {
            const exportDir = path_1.default.join(__dirname, '../../exports');
            if (!fs_1.default.existsSync(exportDir)) {
                return [];
            }
            return fs_1.default.readdirSync(exportDir)
                .filter(file => file.endsWith('.csv') || file.endsWith('.json'))
                .map(file => path_1.default.join(exportDir, file));
        }
        catch (error) {
            console.error('Ошибка получения списка экспортированных файлов:', error);
            return [];
        }
    }
    deleteExportedFile(filePath) {
        try {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Ошибка удаления файла:', error);
            return false;
        }
    }
}
exports.ExportService = ExportService;
//# sourceMappingURL=exportService.js.map