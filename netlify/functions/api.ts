// Назначение файла: входная точка Netlify Functions для Express-приложения (обёртка serverless-http)
import serverless from 'serverless-http';
import app from '../../packages/api/dist/app';

export const handler = serverless(app);
