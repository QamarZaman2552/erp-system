import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Apply saved theme before render (prevents flash of wrong theme)
document.documentElement.setAttribute('data-bs-theme', localStorage.getItem('erp-theme') || 'light');

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
