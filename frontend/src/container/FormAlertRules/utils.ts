import { Time } from 'container/TopNav/DateTimeSelection/config';
import getStartEndRangeTime from 'lib/getStartEndRangeTime';
import getStep from 'lib/getStep';

// toChartInterval converts eval window to chart selection time interval
export const toChartInterval = (evalWindow: string | undefined): Time => {
	switch (evalWindow) {
		case '5m0s':
			return '5min';
		case '10m0s':
			return '10min';
		case '15m0s':
			return '15min';
		case '30m0s':
			return '30min';
		case '1h0m0s':
			return '1hr';
		case '4h0m0s':
			return '4hr';
		case '24h0m0s':
			return '1day';
		default:
			return '5min';
	}
};

export const getUpdatedStepInterval = (evalWindow?: string): number => {
	const { start, end } = getStartEndRangeTime({
		type: 'GLOBAL_TIME',
		interval: toChartInterval(evalWindow),
	});
	return getStep({
		start,
		end,
		inputFormat: 'ns',
	});
};
