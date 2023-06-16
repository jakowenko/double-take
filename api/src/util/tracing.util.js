// The very first import must be Uptrace/OpenTelemetry.
const uptrace = require('@uptrace/node')
const otel = require('@opentelemetry/api')

// Start OpenTelemetry SDK and invoke instrumentations to patch the code.
uptrace.configureOpentelemetry({
  // copy your project DSN here or use UPTRACE_DSN env var
  dsn: 'https://7L33PE-ElkpT_gtZ8OJTMg@api.uptrace.dev/2015',
  serviceName: 'double-take',
  serviceVersion: '1.13.9',
  deploymentEnvironment: 'production',
});

// Other imports. Express is monkey-patched at this point.
const express = require('express')

// Create a tracer.
const tracer = otel.trace.getTracer('app_or_package_name')

// Start the app.
const app = express()
app.listen(3000)