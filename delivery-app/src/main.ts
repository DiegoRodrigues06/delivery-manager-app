import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
// import { App } from './app/app';
import { AppShell } from './app.shell';

bootstrapApplication( AppShell, appConfig)
  .catch((err) => console.error(err));
