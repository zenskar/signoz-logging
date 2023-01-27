package otelconfig

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"go.opentelemetry.io/collector/component"
	"go.opentelemetry.io/collector/confmap"
	"go.opentelemetry.io/collector/receiver/otlpreceiver"
)

func TestConfigUpdater(t *testing.T) {

	config := []byte(
		`receivers:
  otlp:
    protocols:
      grpc:
        endpoint: "http://localhost:6969"
      http:
exporters:
  jaeger:
    endpoint: "http://localhost:14250"
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: []
      exporters: [jaeger, otlp]
`)
	cfg, err := Parse(config)
	if err != nil {
		t.Errorf("failed to parse config: %v", err)
	}
	assert.NotNil(t, cfg)

	cfgUpdater := NewConfigUpdater(cfg)
	assert.NotNil(t, cfgUpdater)
	componentConfig, exists := cfgUpdater.ReceiverConfig(component.NewID("otlp"))
	assert.True(t, exists)
	assert.NotNil(t, componentConfig)
	// Strict config struct
	otlpConfig := &otlpreceiver.Config{}
	cnf := confmap.New()
	err = cnf.Marshal(componentConfig)
	assert.Nil(t, err)
	otlpConfig.Unmarshal(cnf)
	assert.Equal(t, "http://localhost:6969", otlpConfig.GRPC.NetAddr.Endpoint)

	// Assert that original config is not changed yet
	componentConfig, exists = cfgUpdater.ReceiverConfig(component.NewID("otlp"))
	assert.True(t, exists)
	assert.NotNil(t, componentConfig)
	// Strict config struct
	otlpConfig = &otlpreceiver.Config{}
	cnf = confmap.New()
	err = cnf.Marshal(componentConfig)
	assert.Nil(t, err)
	otlpConfig.Unmarshal(cnf)
	assert.Equal(t, "http://localhost:6969", otlpConfig.GRPC.NetAddr.Endpoint)

	// Actually update the config

	otlpConfig.GRPC.NetAddr.Endpoint = "http://localhost:8080"
	cfgUpdater.SetReceiverConfig(component.NewID("otlp"), otlpConfig)

	componentConfig, exists = cfgUpdater.ReceiverConfig(component.NewID("otlp"))
	assert.True(t, exists)
	assert.NotNil(t, componentConfig)
	// Strict config struct
	otlpConfig = &otlpreceiver.Config{}
	cnf = confmap.New()
	err = cnf.Marshal(componentConfig)
	assert.Nil(t, err)
	otlpConfig.Unmarshal(cnf)
	assert.Equal(t, "http://localhost:8080", otlpConfig.GRPC.NetAddr.Endpoint)
}
