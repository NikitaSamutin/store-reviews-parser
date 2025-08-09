import serverless from 'serverless-http';
import app from '../../packages/api/dist/app';

export const handler = serverless(app);
