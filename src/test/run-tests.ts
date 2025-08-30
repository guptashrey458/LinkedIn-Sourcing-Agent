#!/usr/bin/env node

/**
 * Test runner script for comprehensive test execution
 * This script can be used to run different types of tests with proper configuration
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface TestConfig {
  name: string;
  command: string;
  description: string;
  pattern?: string;
}

const TEST_CONFIGS: TestConfig[] = [
  {
    name: 'unit',
    command: 'vitest run --reporter=verbose src/**/*.test.{ts,tsx} --exclude src/**/*.integration.test.{ts,tsx} --exclude src/**/*.accessibility.test.{ts,tsx} --exclude src/**/*.e2e.test.{ts,tsx}',
    description: 'Run unit tests',
    pattern: '**/*.test.{ts,tsx}',
  },
  {
    name: 'integration',
    command: 'vitest run --reporter=verbose src/**/*.integration.test.{ts,tsx}',
    description: 'Run integration tests',
    pattern: '**/*.integration.test.{ts,tsx}',
  },
  {
    name: 'accessibility',
    command: 'vitest run --reporter=verbose src/**/*.accessibility.test.{ts,tsx}',
    description: 'Run accessibility tests',
    pattern: '**/*.accessibility.test.{ts,tsx}',
  },
  {
    name: 'e2e',
    command: 'vitest run --reporter=verbose src/**/*.e2e.test.{ts,tsx}',
    description: 'Run end-to-end tests',
    pattern: '**/*.e2e.test.{ts,tsx}',
  },
  {
    name: 'all',
    command: 'vitest run --reporter=verbose',
    description: 'Run all tests',
  },
  {
    name: 'coverage',
    command: 'vitest run --coverage',
    description: 'Run tests with coverage report',
  },
  {
    name: 'watch',
    command: 'vitest --watch',
    description: 'Run tests in watch mode',
  },
];

function printUsage() {
  console.log('Usage: npm run test:script [test-type] [options]');
  console.log('');
  console.log('Available test types:');
  TEST_CONFIGS.forEach(config => {
    console.log(`  ${config.name.padEnd(15)} - ${config.description}`);
  });
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --verbose, -v  Show verbose output');
  console.log('  --silent, -s   Suppress output');
  console.log('');
  console.log('Examples:');
  console.log('  npm run test:script unit');
  console.log('  npm run test:script integration --verbose');
  console.log('  npm run test:script coverage');
}

function runTests(testType: string, options: { verbose?: boolean; silent?: boolean } = {}) {
  const config = TEST_CONFIGS.find(c => c.name === testType);
  
  if (!config) {
    console.error(`Unknown test type: ${testType}`);
    console.error('Available types:', TEST_CONFIGS.map(c => c.name).join(', '));
    process.exit(1);
  }

  console.log(`Running ${config.description}...`);
  console.log(`Command: ${config.command}`);
  console.log('');

  try {
    const output = execSync(config.command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    if (options.silent && output) {
      console.log(output);
    }

    console.log(`✅ ${config.description} completed successfully`);
  } catch (error: any) {
    console.error(`❌ ${config.description} failed`);
    
    if (error.stdout) {
      console.error('STDOUT:', error.stdout);
    }
    
    if (error.stderr) {
      console.error('STDERR:', error.stderr);
    }
    
    process.exit(error.status || 1);
  }
}

function validateTestEnvironment() {
  const requiredFiles = [
    'vitest.config.ts',
    'src/test/setup.ts',
    'src/test/utils.tsx',
  ];

  const missingFiles = requiredFiles.filter(file => !existsSync(file));
  
  if (missingFiles.length > 0) {
    console.error('Missing required test files:');
    missingFiles.forEach(file => console.error(`  - ${file}`));
    console.error('Please ensure the test infrastructure is properly set up.');
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printUsage();
    return;
  }

  const testType = args[0];
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    silent: args.includes('--silent') || args.includes('-s'),
  };

  // Validate test environment
  validateTestEnvironment();

  // Run tests
  runTests(testType, options);
}

// Run if called directly
if (require.main === module) {
  main();
}

export { runTests, TEST_CONFIGS };