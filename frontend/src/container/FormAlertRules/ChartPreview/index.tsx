import { InfoCircleOutlined } from '@ant-design/icons';
import { StaticLineProps } from 'components/Graph/types';
import Spinner from 'components/Spinner';
import { initialQueriesMap, PANEL_TYPES } from 'constants/queryBuilder';
import GridPanelSwitch from 'container/GridPanelSwitch';
import { timePreferenceType } from 'container/NewWidget/RightContainer/timeItems';
import { Time } from 'container/TopNav/DateTimeSelection/config';
import { useGetQueryRange } from 'hooks/queryBuilder/useGetQueryRange';
import getChartData from 'lib/getChartData';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertDef } from 'types/api/alerts/def';
import { Query } from 'types/api/queryBuilder/queryBuilderData';
import { EQueryType } from 'types/common/dashboard';

import { ChartContainer, FailedMessageContainer } from './styles';
import { covertIntoDataFormats } from './utils';

export interface ChartPreviewProps {
	name: string;
	query: Query | null;
	graphType?: PANEL_TYPES;
	selectedTime?: timePreferenceType;
	selectedInterval?: Time;
	headline?: JSX.Element;
	alertDef?: AlertDef;
	userQueryKey?: string;
	allowSelectedIntervalForStepGen?: boolean;
}

function ChartPreview({
	name,
	query,
	graphType = PANEL_TYPES.TIME_SERIES,
	selectedTime = 'GLOBAL_TIME',
	selectedInterval = '5min',
	headline,
	userQueryKey,
	allowSelectedIntervalForStepGen = false,
	alertDef,
}: ChartPreviewProps): JSX.Element | null {
	const { t } = useTranslation('alerts');
	const threshold = alertDef?.condition.target || 0;

	const thresholdValue = covertIntoDataFormats({
		value: threshold,
		sourceUnit: alertDef?.condition.targetUnit,
		targetUnit: query?.unit,
	});

	const staticLine: StaticLineProps | undefined =
		threshold !== undefined
			? {
					yMin: thresholdValue,
					yMax: thresholdValue,
					borderColor: '#f14',
					borderWidth: 1,
					lineText: `${t('preview_chart_threshold_label')} (y=${thresholdValue} ${
						query?.unit || ''
					})`,
					textColor: '#f14',
			  }
			: undefined;

	const canQuery = useMemo((): boolean => {
		if (!query || query == null) {
			return false;
		}

		switch (query?.queryType) {
			case EQueryType.PROM:
				return query.promql?.length > 0 && query.promql[0].query !== '';
			case EQueryType.CLICKHOUSE:
				return (
					query.clickhouse_sql?.length > 0 &&
					query.clickhouse_sql[0].query?.length > 0
				);
			case EQueryType.QUERY_BUILDER:
				return (
					query.builder.queryData.length > 0 &&
					query.builder.queryData[0].queryName !== ''
				);
			default:
				return false;
		}
	}, [query]);

	const queryResponse = useGetQueryRange(
		{
			query: query || initialQueriesMap.metrics,
			globalSelectedInterval: selectedInterval,
			graphType,
			selectedTime,
			params: {
				allowSelectedIntervalForStepGen,
			},
		},
		{
			queryKey: [
				'chartPreview',
				userQueryKey || JSON.stringify(query),
				selectedInterval,
			],
			retry: false,
			enabled: canQuery,
		},
	);

	const chartDataSet = queryResponse.isError
		? null
		: getChartData({
				queryData: [
					{
						queryData: queryResponse?.data?.payload?.data?.result ?? [],
					},
				],
		  });

	return (
		<ChartContainer>
			{headline}
			{(queryResponse?.isError || queryResponse?.error) && (
				<FailedMessageContainer color="red" title="Failed to refresh the chart">
					<InfoCircleOutlined />{' '}
					{queryResponse.error.message || t('preview_chart_unexpected_error')}
				</FailedMessageContainer>
			)}
			{queryResponse.isLoading && (
				<Spinner size="large" tip="Loading..." height="70vh" />
			)}
			{chartDataSet && !queryResponse.isError && (
				<GridPanelSwitch
					panelType={graphType}
					title={name}
					data={chartDataSet.data}
					isStacked
					name={name || 'Chart Preview'}
					staticLine={staticLine}
					panelData={queryResponse.data?.payload.data.newResult.data.result || []}
					query={query || initialQueriesMap.metrics}
					yAxisUnit={query?.unit}
				/>
			)}
		</ChartContainer>
	);
}

ChartPreview.defaultProps = {
	graphType: PANEL_TYPES.TIME_SERIES,
	selectedTime: 'GLOBAL_TIME',
	selectedInterval: '5min',
	headline: undefined,
	userQueryKey: '',
	allowSelectedIntervalForStepGen: false,
	alertDef: undefined,
};

export default ChartPreview;
