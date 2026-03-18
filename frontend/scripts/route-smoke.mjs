import fs from 'node:fs';
import path from 'node:path';

const appPath = path.resolve(process.cwd(), 'src', 'App.jsx');
const source = fs.readFileSync(appPath, 'utf8');

const requiredRoutes = [
  '/',
  '/login',
  '/register',
  '/projects/:id',
  '/business/dashboard',
  '/business/post-project',
  '/business/projects',
  '/business/profile',
  '/business/notifications',
  '/freelancer/dashboard',
  '/freelancer/projects',
  '/freelancer/work',
  '/freelancer/profile',
  '/freelancer/notifications',
];

const missing = requiredRoutes.filter((route) => !source.includes(`path="${route}"`));

if (missing.length) {
  console.error('route-smoke failed. missing routes:');
  missing.forEach((route) => console.error(`- ${route}`));
  process.exit(1);
}

console.log('route-smoke passed. all critical routes found in App.jsx');
