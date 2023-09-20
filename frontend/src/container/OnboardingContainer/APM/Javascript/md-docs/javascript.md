## Requirements

- Node.js version 14 or newer ([See here](https://github.com/open-telemetry/opentelemetry-js#supported-runtimes))<br></br>

## Send traces to SigNoz Cloud

Based on your application environment, you can choose the setup below to send traces to SigNoz Cloud.

### Application on VMs

From VMs, there are two ways to send data to SigNoz Cloud.

- [Send traces directly to SigNoz Cloud](#send-traces-directly-to-signoz-cloud)
- [Send traces via OTel Collector binary](#send-traces-via-otel-collector-binary) (recommended)

#### **Send traces directly to SigNoz Cloud**

Step 1. Install OpenTelemetry packages

```bash
npm install --save @opentelemetry/api@^1.4.1                                                                       
npm install --save @opentelemetry/sdk-node@^0.39.1
npm install --save @opentelemetry/auto-instrumentations-node@^0.37.0
npm install --save @opentelemetry/exporter-trace-otlp-http@^0.39.1
```

Step 2. Create tracing.js file<br></br>

You need to configure the endpoint for SigNoz cloud in this file. You can find your ingestion key from SigNoz cloud account details sent on your email.

```js
// tracing.js
'use strict'
const process = require('process');
const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// do not set headers in exporterOptions, the OTel spec recommends setting headers through ENV variables
// https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/protocol/exporter.md#specifying-headers-via-environment-variables

// highlight-start
const exporterOptions = {
  url: 'https://ingest.{region}.signoz.cloud:443/v1/traces'
}
// highlight-end

const traceExporter = new OTLPTraceExporter(exporterOptions);
const sdk = new opentelemetry.NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  resource: new Resource({
    // highlight-next-line
    [SemanticResourceAttributes.SERVICE_NAME]: 'node_app'
  })
});

// initialize the SDK and register with the OpenTelemetry API
// this enables the API to record telemetry
sdk.start()

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

Depending on the choice of your region for SigNoz cloud, the ingest endpoint will vary according to this table.

 US -	ingest.us.signoz.cloud:443/v1/traces <br></br>

 IN -	ingest.in.signoz.cloud:443/v1/traces <br></br>

 EU - ingest.eu.signoz.cloud:443/v1/traces <br></br>

Step 3. Run the application<br></br>

Make sure you set the `OTEL_EXPORTER_OTLP_HEADERS` env as follows

```bash
OTEL_EXPORTER_OTLP_HEADERS="signoz-access-token=<SIGNOZ_INGESTION_KEY>" node -r ./tracing.js app.js
```

`SIGNOZ_INGESTION_KEY` is the API token provided by SigNoz. You can find your ingestion key from SigNoz cloud account details sent on your email.

---

#### **Send traces via OTel Collector binary**

OTel Collector binary helps to collect logs, hostmetrics, resource and infra attributes. It is recommended to install Otel Collector binary to collect and send traces to SigNoz cloud. You can correlate signals and have rich contextual data through this way.

You can find instructions to install OTel Collector binary [here](https://signoz.io/docs/tutorial/opentelemetry-binary-usage-in-virtual-machine/) in your VM. Once you are done setting up your OTel Collector binary, you can follow the below steps for instrumenting your Javascript application.

Step 1. Install OpenTelemetry packages

```js
npm install --save @opentelemetry/api@^1.4.1
npm install --save @opentelemetry/sdk-node@^0.39.1
npm install --save @opentelemetry/auto-instrumentations-node@^0.37.0
npm install --save @opentelemetry/exporter-trace-otlp-http@^0.39.1
```

Step 2. Create tracing.js file<br></br>

```js
// tracing.js
'use strict'
const process = require('process');
const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const exporterOptions = {
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
}

const traceExporter = new OTLPTraceExporter(exporterOptions);
const sdk = new opentelemetry.NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  resource: new Resource({
    // highlight-next-line
    [SemanticResourceAttributes.SERVICE_NAME]: 'node_app'
  })
});

// initialize the SDK and register with the OpenTelemetry API
// this enables the API to record telemetry
sdk.start()

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

Step 3. Run the application<br></br>

```bash
node -r ./tracing.js app.js
```

---

### Applications Deployed on Kubernetes

For Javascript application deployed on Kubernetes, you need to install OTel Collector agent in your k8s infra to collect and send traces to SigNoz Cloud. You can find the instructions to install OTel Collector agent [here](/docs/tutorial/kubernetes-infra-metrics/).

Once you have set up OTel Collector agent, you can proceed with OpenTelemetry Javascript instrumentation by following the below steps:

Step 1. Install OpenTelemetry packages

```js
npm install --save @opentelemetry/api@^1.4.1
npm install --save @opentelemetry/sdk-node@^0.39.1
npm install --save @opentelemetry/auto-instrumentations-node@^0.37.0
npm install --save @opentelemetry/exporter-trace-otlp-http@^0.39.1
```

Step 2. Create tracing.js file<br></br>

```js
// tracing.js
'use strict'
const process = require('process');
const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const exporterOptions = {
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
}

const traceExporter = new OTLPTraceExporter(exporterOptions);
const sdk = new opentelemetry.NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  resource: new Resource({
    // highlight-next-line
    [SemanticResourceAttributes.SERVICE_NAME]: 'node_app'
  })
});

// initialize the SDK and register with the OpenTelemetry API
// this enables the API to record telemetry
sdk.start()

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

Step 3. Run the application<br></br>
```bash
node -r ./tracing.js app.js
```