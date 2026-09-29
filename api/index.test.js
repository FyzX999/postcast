/**
 * Bug Condition Exploration Test
 * 
 * **Validates: Requirements 1.1, 1.3**
 * 
 * CRITICAL: This test is EXPECTED TO FAIL on unfixed code
 * - Failure confirms the bug exists (exports Express app instance with wrong pattern)
 * - Success confirms the fix works (exports Vercel-compatible handler or wrapped app)
 * 
 * DO NOT attempt to fix the test or implementation when this fails initially
 * 
 * The bug is subtle: Express apps ARE functions, but Vercel expects either:
 * 1. A handler wrapper function, OR
 * 2. module.exports.default to be set for proper ESM/CommonJS interop
 */

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Property 1: Bug Condition - Vercel Export Type Validation', () => {
  test('api/index.js exports proper Vercel handler (has .default or is wrapper function)', () => {
    // Load the module export from api/index.js
    const moduleExport = require('./index.js');
    
    // Bug Condition Check: Vercel requires module.exports.default to be set
    // for proper serverless function detection in @vercel/node runtime
    // 
    // On UNFIXED code: moduleExport.default will be undefined
    // On FIXED code: moduleExport.default will be the handler function
    //
    // Alternative fix: export a wrapper function instead of bare Express app
    const hasDefaultExport = moduleExport.default !== undefined;
    const isWrapperFunction = typeof moduleExport === 'function' && 
                              !moduleExport.hasOwnProperty('listen');
    
    // The fix should either:
    // 1. Set module.exports.default = app (for Vercel ESM interop), OR
    // 2. Export a wrapper function without .listen() method
    const isVercelCompatible = hasDefaultExport || isWrapperFunction;
    
    // Document the current state
    console.log('\n=== Vercel Compatibility Check ===');
    console.log('Has .default export:', hasDefaultExport);
    console.log('Is wrapper function (no .listen):', isWrapperFunction);
    console.log('Is Vercel compatible:', isVercelCompatible);
    console.log('=====================================\n');
    
    // This assertion encodes the expected behavior
    // EXPECTED TO FAIL on unfixed code (no .default, has .listen)
    expect(isVercelCompatible).toBe(true);
  });

/**
 * Preservation Property Tests
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * IMPORTANT: These tests capture baseline behavior on UNFIXED code
 * - Tests should PASS on unfixed code (documenting what to preserve)
 * - Tests should PASS on fixed code (confirming no regressions)
 * 
 * Observation-first methodology:
 * 1. Observe Express app's routes, middleware, and configuration
 * 2. Write tests capturing that observed behavior
 * 3. Run on unfixed code to establish baseline
 * 4. Run on fixed code to prevent regressions
 */

describe('Property 2: Preservation - Express App Behavior Unchanged', () => {
  
  test('Express app has all expected API routes registered', () => {
    const app = require('./index.js');
    
    // Extract the actual Express app (handle both direct export and wrapper patterns)
    const expressApp = app.app || app;
    
    // Get the route stack from Express
    const routes = [];
    
    // Express stores routes in app._router.stack
    if (expressApp._router && expressApp._router.stack) {
      expressApp._router.stack.forEach((layer) => {
        if (layer.route) {
          // This is a route layer
          const methods = Object.keys(layer.route.methods);
          methods.forEach(method => {
            routes.push({
              method: method.toUpperCase(),
              path: layer.route.path
            });
          });
        }
      });
    }
    
    console.log('\n=== Observed Routes ===');
    routes.forEach(r => console.log(`${r.method} ${r.path}`));
    console.log('=======================\n');
    
    // Requirements 3.1: API routes must be preserved
    const expectedRoutes = [
      { method: 'GET', path: '/api/platforms' },
      { method: 'GET', path: '/api/settings' },
      { method: 'POST', path: '/api/settings' },
      { method: 'POST', path: '/api/generate' },
      { method: 'POST', path: '/api/suggest-hashtags' },
      { method: 'POST', path: '/api/optimize-content' },
      { method: 'POST', path: '/api/upload' },
      { method: 'GET', path: '/api/posts' },
      { method: 'POST', path: '/api/posts/:id/delete' },
      { method: 'POST', path: '/api/publish' },
      { method: 'GET', path: '/api/analytics' },
      { method: 'POST', path: '/api/disconnect/:p' },
      { method: 'GET', path: '/api/health' },
      { method: 'GET', path: '*' } // catch-all route
    ];
    
    // Verify each expected route exists
    expectedRoutes.forEach(expectedRoute => {
      const found = routes.some(r => 
        r.method === expectedRoute.method && 
        r.path === expectedRoute.path
      );
      expect(found).toBe(true);
    });
    
    // Total route count should match expectations
    expect(routes.length).toBeGreaterThanOrEqual(expectedRoutes.length);
  });
  
  test('Express app has expected middleware stack', () => {
    const app = require('./index.js');
    const expressApp = app.app || app;
    
    // Express stores middleware in app._router.stack
    const middlewareNames = [];
    
    if (expressApp._router && expressApp._router.stack) {
      expressApp._router.stack.forEach((layer) => {
        if (layer.name && layer.name !== '<anonymous>') {
          middlewareNames.push(layer.name);
        }
        // Handle express.json middleware
        if (layer.handle && layer.handle.name === 'jsonParser') {
          middlewareNames.push('jsonParser');
        }
        // Handle express.static middleware
        if (layer.name === 'serveStatic') {
          middlewareNames.push('serveStatic');
        }
      });
    }
    
    console.log('\n=== Observed Middleware ===');
    console.log('Middleware stack:', middlewareNames);
    console.log('===========================\n');
    
    // Requirements 3.2, 3.3: Middleware must be preserved
    // We should have express.json() middleware
    const hasJsonParser = expressApp._router.stack.some(layer => 
      layer.handle && layer.handle.name === 'jsonParser'
    );
    
    // We should have static file serving middleware
    const hasStaticMiddleware = expressApp._router.stack.some(layer => 
      layer.name === 'serveStatic'
    );
    
    expect(hasJsonParser).toBe(true);
    expect(hasStaticMiddleware).toBe(true);
  });
  
  test('Property: Route registration is preserved across all modifications', () => {
    // Property-based test: verify routes remain registered
    fc.assert(
      fc.property(
        fc.constantFrom(
          '/api/platforms',
          '/api/generate',
          '/api/publish',
          '/api/settings',
          '/api/upload',
          '/api/posts',
          '/api/health'
        ),
        (routePath) => {
          const app = require('./index.js');
          const expressApp = app.app || app;
          
          // Check if route exists in the route stack
          let routeExists = false;
          
          if (expressApp._router && expressApp._router.stack) {
            expressApp._router.stack.forEach((layer) => {
              if (layer.route && layer.route.path === routePath) {
                routeExists = true;
              }
            });
          }
          
          // Property: All core API routes must exist
          return routeExists;
        }
      ),
      { numRuns: 20 }
    );
  });
  
  test('Express app can process requests through middleware chain', () => {
    const app = require('./index.js');
    const expressApp = app.app || app;
    
    // Verify the Express app is callable (can process requests)
    expect(typeof expressApp === 'function').toBe(true);
    
    // Verify it has the Express app methods
    expect(typeof expressApp.listen).toBe('function');
    expect(typeof expressApp.use).toBe('function');
    expect(typeof expressApp.get).toBe('function');
    expect(typeof expressApp.post).toBe('function');
    
    // Requirement 3.5: Must work with server.js for local development
    // The app should be importable and have .listen() for server.js
    expect(expressApp.listen).toBeDefined();
  });
  
  test('Static file middleware configuration is preserved', () => {
    const app = require('./index.js');
    const expressApp = app.app || app;
    
    // Count static file middleware instances
    let staticMiddlewareCount = 0;
    
    if (expressApp._router && expressApp._router.stack) {
      expressApp._router.stack.forEach((layer) => {
        if (layer.name === 'serveStatic') {
          staticMiddlewareCount++;
        }
      });
    }
    
    console.log('\n=== Static Middleware Count ===');
    console.log('Number of serveStatic middleware:', staticMiddlewareCount);
    console.log('================================\n');
    
    // Requirement 3.2: Static file serving must be preserved
    // We expect at least one static middleware (for /uploads)
    expect(staticMiddlewareCount).toBeGreaterThanOrEqual(1);
  });
  
  test('Catch-all route exists for serving index.html', () => {
    const app = require('./index.js');
    const expressApp = app.app || app;
    
    // Find the catch-all route (*)
    let hasCatchAll = false;
    
    if (expressApp._router && expressApp._router.stack) {
      expressApp._router.stack.forEach((layer) => {
        if (layer.route && layer.route.path === '*') {
          hasCatchAll = true;
          
          // Verify it's a GET route
          const hasGetMethod = layer.route.methods.get === true;
          expect(hasGetMethod).toBe(true);
        }
      });
    }
    
    // Requirement 3.4: Catch-all route must be preserved
    expect(hasCatchAll).toBe(true);
  });
  
  test('Property: All middleware remains in the same execution order', () => {
    // Get initial middleware order from unfixed code
    const app = require('./index.js');
    const expressApp = app.app || app;
    
    const middlewareOrder = [];
    
    if (expressApp._router && expressApp._router.stack) {
      expressApp._router.stack.forEach((layer, index) => {
        middlewareOrder.push({
          index,
          name: layer.name,
          route: layer.route?.path || null,
          hasHandle: !!layer.handle
        });
      });
    }
    
    console.log('\n=== Middleware Execution Order ===');
    middlewareOrder.forEach(m => {
      if (m.route) {
        console.log(`${m.index}: Route ${m.route} (${m.name})`);
      } else {
        console.log(`${m.index}: Middleware ${m.name}`);
      }
    });
    console.log('===================================\n');
    
    // Requirement 3.3: Middleware order must be preserved
    // Verify that express.json comes before routes
    const jsonParserIndex = middlewareOrder.findIndex(m => 
      m.name === 'jsonParser' || (m.hasHandle && !m.route)
    );
    const firstRouteIndex = middlewareOrder.findIndex(m => m.route !== null);
    
    if (jsonParserIndex !== -1 && firstRouteIndex !== -1) {
      // JSON parser should come before routes
      expect(jsonParserIndex).toBeLessThan(firstRouteIndex);
    }
    
    // Verify catch-all route is last
    const catchAllIndex = middlewareOrder.findIndex(m => m.route === '*');
    if (catchAllIndex !== -1) {
      // Catch-all should be at the end
      const routeIndices = middlewareOrder
        .map((m, i) => m.route !== null ? i : -1)
        .filter(i => i !== -1);
      expect(catchAllIndex).toBe(Math.max(...routeIndices));
    }
  });
  
  test('Property: Module export remains usable by server.js', () => {
    // This property ensures backwards compatibility with local development
    // server.js expects to be able to: const app = require('./api/index')
    // and then call app.listen(port)
    
    const moduleExport = require('./index.js');
    
    // Get the Express app (handle both direct export and wrapper patterns)
    const expressApp = moduleExport.app || moduleExport;
    
    // Requirement 3.5: Must work with server.js
    // The exported module should provide access to an Express app with .listen()
    const canBeUsedByServerJs = typeof expressApp === 'function' && 
                                 typeof expressApp.listen === 'function';
    
    expect(canBeUsedByServerJs).toBe(true);
    
    // Additionally verify it has other Express app methods
    expect(typeof expressApp.use).toBe('function');
    expect(typeof expressApp.get).toBe('function');
    expect(typeof expressApp.post).toBe('function');
  });
});

  test('module export analysis - document current export type', () => {
    const moduleExport = require('./index.js');
    
    // Diagnostic information about the export
    const exportType = typeof moduleExport;
    const isFunction = typeof moduleExport === 'function';
    const hasDefaultExport = moduleExport.default !== undefined;
    const hasListenMethod = typeof moduleExport?.listen === 'function';
    const constructorName = moduleExport?.constructor?.name;
    
    // Log diagnostic info for documentation
    console.log('\n=== Module Export Analysis ===');
    console.log('typeof export:', exportType);
    console.log('is Function:', isFunction);
    console.log('has .default property:', hasDefaultExport);
    console.log('has .listen() method:', hasListenMethod);
    console.log('constructor name:', constructorName);
    console.log('==============================\n');
    
    // Document the counterexample found
    if (!hasDefaultExport && hasListenMethod) {
      console.log('\n🔍 COUNTEREXAMPLE FOUND:');
      console.log('The module exports a bare Express app instance:');
      console.log('- It IS a function (Express apps are callable)');
      console.log('- It has .listen() method (Express app characteristic)');
      console.log('- It does NOT have .default export (required for Vercel)');
      console.log('- This causes 500 FUNCTION_INVOCATION_FAILED on Vercel\n');
    }
    
    // This check documents that the export is a bare Express app
    // which lacks the .default export that Vercel's @vercel/node expects
    expect(hasDefaultExport || !hasListenMethod).toBe(true);
  });
});
