#!/usr/bin/env node
import { Command } from 'commander';
import { DevServerSettings, startDevServer } from './dev';

const app = new Command();
app
  .name('@staroverlay/cli')
  .description(
    'A collection of command line tools for working with StarOverlay.',
  )
  .version(process.env.npm_package_version || '<unknown>');

// Dev Server
app
  .command('dev')
  .description('Start the development server')
  .option('-b, --bind <host>', 'Host to listen', '127.0.0.1')
  .option('-e, --engine <express/vite>', 'Backend engine to use', 'none')
  .option('-p, --port <port>', 'Port to run the server on', parseInt, 3200)
  .option(
    '-r, --root <root>',
    'Root directory to serve files from',
    process.cwd(),
  )
  .action((options: DevServerSettings) => {
    startDevServer(options);
  });

app.parse();
