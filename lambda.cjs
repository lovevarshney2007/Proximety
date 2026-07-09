'use strict';

/**
 * AWS Lambda entry point (CommonJS wrapper for ESM app)
 * 
 * Since the project uses "type": "module" (ESM), Lambda needs a .cjs
 * wrapper that dynamically imports the ESM handler at cold-start time.
 */

let cachedHandler;

module.exports.handler = async (event, context) => {
  if (!cachedHandler) {
    const mod = await import('./src/server.js');
    cachedHandler = mod.handler;
  }
  return cachedHandler(event, context);
};
