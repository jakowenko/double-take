import { configureOpentelemetry } from '@uptrace/web'

// configureOpentelemetry automatically setups window.onerror handler.
configureOpentelemetry({
  // Set dsn or UPTRACE_DSN env var.
  dsn: 'https://7L33PE-ElkpT_gtZ8OJTMg@api.uptrace.dev/2015',

  serviceName: 'double-take',
  serviceVersion: '1.13.9',
})