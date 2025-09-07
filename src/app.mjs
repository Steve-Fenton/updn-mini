#!/usr/bin/env node

import { promises as fs } from 'fs';
import { Monitor } from './monitor.mjs';

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const parsed = {};
  
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('-')) {
      const key = arg.substring(1);
      const value = args[i + 1];
      if (value && !value.startsWith('-')) {
        parsed[key] = value;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }
  
  return parsed;
}

/**
 * Load configuration from local file
 */
async function loadConfigFromFile(filePath) {
  try {
    let data;
    if (/^https?:\/\//.test(filePath)) {
      const res = await fetch(filePath);
      if (!res.ok) {
      throw new Error(`Failed to fetch config from URL: ${filePath} (${res.status})`);
      }
      data = await res.text();
    } else {
      data = await fs.readFile(filePath, 'utf8');
    }
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Config file not found: ${filePath}`);
    } else if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in file: ${error.message}`);
    }
    throw error;
  }
}

async function main() {
  console.log('Starting UpDn!');
  
  try {
    const args = parseArgs(process.argv);
    
    if (args.config) {
      const config = await loadConfigFromFile(args.config);
      const monitor = new Monitor(config);

      await Promise.all([
        monitor.checkCertificates(config),
        monitor.checkUptime(config)
      ]);

    } else {
      console.log('No config file specified');
    }
    
    console.log('Script completed successfully.');
  } catch (error) {
    console.error('Error occurred:', error.message);
    process.exit(1);
  }
}

main();