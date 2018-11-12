'use strict';
const createRouter = require('@arangodb/foxx/router');
const db = require('@arangodb').db;
const aql = require('@arangodb').aql;
const internal = require('internal');

const metrics = require('./metrics.js');

// system
metrics.registerCounter(
  "arango_minor_page_faults",
  ["system", "minorPageFaults"],
  "The number of minor faults the process has made which have not required loading a memory page from disk. " +
    "This figure is not reported on Windows.");
metrics.registerCounter(
  "arango_major_page_faults",
  ["system", "majorPageFaults"],
  "On Windows, this figure contains the total number of page faults. On other system, this figure contains " +
    "the number of major faults the process has made which have required loading a memory page from disk.");
metrics.registerCounter(
  "arango_user_time",
  ["system", "userTime"],
  "Amount of time that this process has been scheduled in user mode, measured in seconds.");
metrics.registerCounter(
  "arango_system_time",
  ["system", "systemTime"],
  "Amount of time that this process has been scheduled in kernel mode, measured in seconds.");
metrics.registerGauge(
  "arango_number_of_threads",
  ["system", "numberOfThreads"],
  "Number of threads in the arangod process.");
metrics.registerGauge(
  "arango_resident_size",
  ["system", "residentSize"],
  "The total size of the number of pages the process has in real memory. This is just the pages which count " +
    "toward text, data, or stack space. This does not include pages which have not been demand-loaded in, or " +
    "which are swapped out. The resident set size is reported in bytes.");
metrics.registerGauge(
  "arango_resident_size_percent",
  ["system", "residentSizePercent"],
  "The percentage of physical memory used by the process as resident set size.");
metrics.registerGauge(
  "arango_virtual_size",
  ["system", "virtualSize"],
  "On Windows, this figure contains the total amount of memory that the memory manager has committed for the " +
    "arangod process. On other systems, this figure contains The size of the virtual memory the process is using.");

// client
metrics.registerGauge(
    "arango_number_of_http_connections",
    ["client", "httpConnections"],
    "Number of open client http connections.");
metrics.registerHistogram(
  "arango_connection_time",
  ["client", "connectionTime"],
  internal.connectionTimeDistribution,
  "Total connection time of a client.");
metrics.registerHistogram(
  "arango_total_time",
  ["client", "totalTime"],
  internal.requestTimeDistribution,
  "Total time needed to answer a request.");
metrics.registerHistogram(
  "arango_request_time",
  ["client", "requestTime"],
  internal.requestTimeDistribution,
  "Request time needed to answer a request.");
metrics.registerHistogram(
  "arango_queue_time",
  ["client", "queueTime"],
  internal.requestTimeDistribution,
  "Queue time needed to answer a request.");
metrics.registerHistogram(
  "arango_io_time",
  ["client", "ioTime"],
  internal.requestTimeDistribution,
  "IO time needed to answer a request.");
metrics.registerHistogram(
  "arango_bytes_sent",
  ["client", "bytesSent"],
  internal.bytesSentDistribution,
  "Bytes sent for a request.");
metrics.registerHistogram(
  "arango_bytes_received",
  ["client", "bytesReceived"],
  internal.bytesReceivedDistribution,
  "Bytes received for a request.");

// server
metrics.registerGauge(
    "arango_v8_context{status=\"available\"}",
    ["server", "v8Context", "available"],
    "Number of available v8 context.");
metrics.registerGauge(
    "arango_v8_context{status=\"busy\"}",
    ["server", "v8Context", "busy"],
    "Number of busy v8 context.");
metrics.registerGauge(
    "arango_v8_context{status=\"dirty\"}",
    ["server", "v8Context", "dirty"],
    "Number of dirty v8 context.");
metrics.registerGauge(
    "arango_v8_context{status=\"free\"}",
    ["server", "v8Context", "free"],
    "Number of free v8 context.");
metrics.registerGauge(
    "arango_v8_context{status=\"max\"}",
    ["server", "v8Context", "max"],
    "Number of max v8 context.");

metrics.registerGauge(
    "arango_threads{status=\"running\"}",
    ["server", "threads", "running"],
    "Number of running threads.");
metrics.registerGauge(
    "arango_threads{status=\"working\"}",
    ["server", "threads", "working"],
    "Number of working threads.");
metrics.registerGauge(
    "arango_threads{status=\"blocked\"}",
    ["server", "threads", "blocked"],
    "Number of blocked threads.");

function getMetrics() {
  const result = db._query(aql`
    FOR s IN _statisticsRaw
      SORT s.time DESC
      LIMIT 1
      RETURN s
    `);
  return metrics.formatAll(result._documents[0]);
}

const router = createRouter();
module.context.use(router);

router.get('/', function (req, res) {
  res.send(getMetrics());
})
.response(['text/plain'], 'Prometheus metrics.')
.summary('Prometheus metrics')
.description('Provides the internal statistics from ArangoDB in the Prometheus format.');