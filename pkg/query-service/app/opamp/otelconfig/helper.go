package otelconfig

import (
	"github.com/mitchellh/mapstructure"
	"go.opentelemetry.io/collector/component"
	"go.opentelemetry.io/collector/confmap"
	"go.opentelemetry.io/collector/exporter/otlpexporter"
	"go.opentelemetry.io/collector/receiver/otlpreceiver"
)

func UnmarshalOTLPReceiverConfig(cfg component.Config) (*otlpreceiver.Config, error) {
	otlpConfig := &otlpreceiver.Config{}
	cnf := confmap.New()
	err := cnf.Marshal(cfg)
	if err != nil {
		return nil, err
	}
	otlpConfig.Unmarshal(cnf)
	return otlpConfig, nil
}

func UnmarshalOTLPExporterConfig(cfg component.Config) (*otlpexporter.Config, error) {
	otlpConfig := &otlpexporter.Config{}
	cnf := confmap.New()
	err := cnf.Marshal(cfg)
	if err != nil {
		return nil, err
	}
	mapstructure.Decode(cfg, otlpConfig)
	return otlpConfig, nil
}
