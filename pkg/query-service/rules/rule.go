package rules

import (
	"context"
	"time"

	"go.signoz.io/signoz/pkg/query-service/model"
	v3 "go.signoz.io/signoz/pkg/query-service/model/v3"
	"go.signoz.io/signoz/pkg/query-service/utils/labels"
)

// A Rule encapsulates a vector expression which is evaluated at a specified
// interval and acted upon (currently used for alerting).
type Rule interface {
	ID() string
	Name() string
	Type() RuleType

	Labels() labels.BaseLabels
	Annotations() labels.BaseLabels
	Condition() *RuleCondition
	State() model.AlertState
	ActiveAlerts() []*Alert

	PreferredChannels() []string

	Eval(context.Context, time.Time) (interface{}, error)
	String() string
	SetLastError(error)
	LastError() error
	SetHealth(RuleHealth)
	Health() RuleHealth
	SetEvaluationDuration(time.Duration)
	GetEvaluationDuration() time.Duration
	SetEvaluationTimestamp(time.Time)
	GetEvaluationTimestamp() time.Time

	RecordRuleStateHistory(ctx context.Context, prevState, currentState model.AlertState, itemsToAdd []v3.RuleStateHistory) error

	SendAlerts(ctx context.Context, ts time.Time, resendDelay time.Duration, interval time.Duration, notifyFunc NotifyFunc)
}
