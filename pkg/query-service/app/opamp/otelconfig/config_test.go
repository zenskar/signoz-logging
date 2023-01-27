package otelconfig

import "testing"

func TestConfigParse(t *testing.T) {
	configCases := [][]byte{
		[]byte(
			`receivers:
  otlp:
    protocols:
      grpc:
      http:
exporters:
  jaeger:
    endpoint: "http://localhost:14250"
  otlp:
    endpoint: "http://localhost:4317"
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: []
      exporters: [jaeger, otlp]
`),
	}
	for _, tc := range configCases {
		_, err := Parse(tc)
		if err != nil {
			t.Errorf("failed to parse config: %v", err)
		}
	}
}
