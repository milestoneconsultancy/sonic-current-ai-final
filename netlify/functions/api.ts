process.env.IS_NETLIFY_FUNCTION = 'true';
import serverless from 'serverless-http';
import { app } from '../../server';

export const handler = serverless(app, {
  binary: [
    'audio/mpeg',
    'audio/mp4',
    'audio/*',
    'video/mp4',
    'application/octet-stream',
  ],
});
