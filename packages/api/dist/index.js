"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 3000;
app_1.default.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📱 Парсер отзывов готов к работе`);
    console.log(`🌐 API доступен по адресу: http://localhost:${PORT}/api`);
});
//# sourceMappingURL=index.js.map