package opamp

import (
	"fmt"

	deepcopy "github.com/barkimedes/go-deepcopy"

	"github.com/knadh/koanf/parsers/yaml"
	"go.opentelemetry.io/collector/confmap"
	model "go.signoz.io/signoz/pkg/query-service/app/opamp/model"
	"go.signoz.io/signoz/pkg/query-service/app/opamp/otelconfig/otlpreceiver"
)

const (
	TracesLbPipelineName      = "traces/lb"
	TracesDefaultPipelineName = "traces"
	OtlpExporterName          = "otlp_internal"
)

func ConfigureLbExporter() error {
	// acquire lock on config updater
	agents := opAmpServer.agents.GetAllAgents()
	var lbAgents []*model.Agent
	var nonLbreceivers []*model.Agent

	for _, agent := range agents {
		if agent.CanLB {
			lbAgents = append(lbAgents, agent)
		} else {
			nonLbreceivers = append(nonLbreceivers, agent)
		}
	}

	if len(lbAgents) == 0 {
		return fmt.Errorf("at least one agent with LB exporter support required")
	}

	process := func(dryRun bool) error {
		// todo: build a worker gorup and call agent updates in parallel

		for _, agent := range lbAgents {
			configureLbAgents(agent, dryRun)
		}

		for _, agent := range nonLbreceivers {
			configureLbAgents(agent, dryRun)
		}

		return nil
	}
	// todo(): allow dry run support in collecto rfirst
	// if err := process(true); err != nil {
	//	return err
	// }

	process(false)

	// if any of theagents fail, do not apply the config
	return nil
}

// configureLbAgents deploys lb exporter specific config to agent
func configureLbAgents(agent *model.Agent, dryRun bool) error {
	config := agent.EffectiveConfig
	c, err := yaml.Parser().Unmarshal([]byte(config))
	if err != nil {
		return err
	}
	agentConf := confmap.NewFromStringMap(c)
	err = prepareLbSpec(agentConf, agent.CanLB, dryRun)
	if err != nil {
		return err
	}
	// apply uodated config to agent
	return nil
}

// prepareLbSpec deploys lb exporter specific config to agent
func prepareLbSpec(agentConf *confmap.Conf, canLB bool, dryRun bool) error {

	// fetch agent config
	var serviceConf *confmap.Conf
	var err error
	if canLB {
		serviceConf, err = prepareLbAgentSpec(agentConf)
	} else {
		serviceConf, err = prepareNonLbAgentSpec(agentConf)
	}

	if err != nil {
		return err
	}

	err = agentConf.Merge(serviceConf)
	if err != nil {
		return err
	}

	return nil
}

// prepareLbAgentSpec creates LB exporter agents
func prepareLbAgentSpec(agentConf *confmap.Conf) (*confmap.Conf, error) {

	// add a new otlp receiver otlp_internal at 0.0.0.0:4949
	// this receiver will enable collecting traces re-routed by lb exporter

	// add a new pipeline
	//  traces/lb:
	// 		receivers: [otlp, jaeger]
	// 		processors: []
	// 		exporters: [lbExporter]

	// update receiver in service > pipelines > traces
	// traces:
	//		receivers: [otlp_internal]
	//		processors: [signoz_tail_sampling, batch]
	//		exporters: [clickhousetraceexporter]

	// apply updated config

	// perform above in dry-run mode and then final mode
	// if all agents succeed exit success else fail

	receivers := agentConf.Get("receivers").(map[string]interface{})

	// add otlp internal receiver to receive traces from lb exporter
	// at 0.0.0.0:4949
	receivers[OtlpExporterName] = otlpreceiver.Config{
		HTTP: otlpreceiver.HTTPServerSettings{
			Endpoint: "0.0.0.0:4949",
		},
	}

	exporters := agentConf.Get("exporters").(map[string]interface{})
	exporters["loadbalancing"] = map[string]interface{}{
		"protocol": map[string]interface{}{
			"otlp": map[string]interface{}{
				"timeout": "1s",
			},
		},
		"resolver": map[string]interface{}{
			"dns": map[string]interface{}{
				"hostname": []interface{}{
					// todo: need to find out this config
					"signoz.example.com",
				},
			},
		},
	}

	updatedReceivers := map[string]interface{}{
		"receivers": receivers,
		"exporters": exporters,
	}

	updatedReceiverConf := confmap.NewFromStringMap(updatedReceivers)

	err := agentConf.Merge(updatedReceiverConf)
	if err != nil {
		return nil, err
	}

	// remove [jaegar, otlp] from pipelines >> traces
	// change pipeline to
	//	traces:
	//		receivers: [otlp_internal]
	//		....

	service := agentConf.Get("service").(map[string]interface{})
	pipelines := service["pipelines"].(map[string]interface{})

	preUpdateTraces := service["pipelines"].(map[string]interface{})["traces"].(map[string]interface{})

	// capture existing receiver list in case lb config needs to be applied
	preUpdateRcvrs := preUpdateTraces["receivers"].([]interface{})

	pipelines[TracesLbPipelineName] = map[string]interface{}{
		"receivers":  deepcopy.Anything(preUpdateRcvrs),
		"processors": []string{""},
		"exporters":  []string{"lbexporter"},
	}
	preUpdateTraces["receivers"] = []string{"otlp_internal"}
	pipelines["traces"] = deepcopy.Anything(preUpdateTraces)

	service["pipelines"] = pipelines

	// todo(amol): try updating the traces keys directly but if that
	// destroys the rest of the pipeline then update full pipelines[]
	s := map[string]interface{}{
		"service": service,
	}

	return confmap.NewFromStringMap(s), nil

}

// prepareNonLbAgentSpec creates non-LB exporter agents that handle otlp receiver
// only.
func prepareNonLbAgentSpec(agentConf *confmap.Conf) (*confmap.Conf, error) {

	receivers := agentConf.Get("receivers").(map[string]interface{})

	// add otlp internal receiver to receive traces from lb exporter
	// at 0.0.0.0:4949
	receivers["otlp_internal"] = otlpreceiver.Config{
		HTTP: otlpreceiver.HTTPServerSettings{
			Endpoint: "0.0.0.0:4949",
		},
	}

	updatedReceivers := map[string]interface{}{
		"receivers": receivers,
	}

	updatedReceiverConf := confmap.NewFromStringMap(updatedReceivers)

	err := agentConf.Merge(updatedReceiverConf)
	if err != nil {
		return nil, err
	}

	// remove [jaegar, otlp] from pipelines >> traces
	// change pipeline to
	//	traces:
	//		receivers: [otlp_internal]
	//		....

	service := agentConf.Get("service").(map[string]interface{})
	pipelines := service["pipelines"].(map[string]interface{})

	preUpdateTraces := service["pipelines"].(map[string]interface{})["traces"].(map[string]interface{})

	preUpdateTraces["receivers"] = []string{"otlp_internal"}
	pipelines["traces"] = deepcopy.Anything(preUpdateTraces)

	service["pipelines"] = pipelines

	// todo(amol): try updating the traces keys directly but if that
	// destroys the rest of the pipeline then update full pipelines[]
	s := map[string]interface{}{
		"service": service,
	}

	return confmap.NewFromStringMap(s), nil

}

// DisableLbExporter in a given agent
func DisableLbExporter(agent *model.Agent, dryRun bool) error {
	// reverse the steps from EnableLbExporter
	// remove otlp_internal from pipelines >> traces
	// move receivers from pipelines>>traces/lb to pipelines >> traces
	// remove pipeline traces/lb
	return nil
}
