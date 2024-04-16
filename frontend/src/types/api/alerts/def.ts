import { ICompositeMetricQuery } from 'types/api/alerts/compositeQuery';

// default match type for threshold
export const defaultMatchType = '1';

// default eval window
export const defaultEvalWindow = '5m0s';

export const defaultFrequency = '1m0s';

// default compare op: above
export const defaultCompareOp = '1';

export interface AlertDef {
	id?: number;
	alertType?: string;
	alert?: string;
	ruleType?: string;
	frequency?: string;
	condition: RuleCondition;
	labels?: Labels;
	annotations?: Labels;
	evalWindow?: string;
	source?: string;
	disabled?: boolean;
	preferredChannels?: string[];
	broadcastToAll?: boolean;
	version?: string;
}

export interface RuleCondition {
	compositeQuery: ICompositeMetricQuery;
	op?: string;
	target?: number;
	matchType?: string;
	targetUnit?: string;
	selectedQueryName?: string;
	alertOnAbsent?: boolean | undefined;
	absentFor?: number | undefined;
}

export interface Labels {
	[key: string]: string;
}
