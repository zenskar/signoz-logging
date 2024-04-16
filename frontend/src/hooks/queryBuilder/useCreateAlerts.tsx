import { getQueryRangeFormat } from 'api/dashboard/queryRangeFormat';
import { SOMETHING_WENT_WRONG } from 'constants/api';
import { DEFAULT_ENTITY_VERSION } from 'constants/app';
import { QueryParams } from 'constants/query';
import ROUTES from 'constants/routes';
import { useNotifications } from 'hooks/useNotifications';
import { getDashboardVariables } from 'lib/dashbaordVariables/getDashboardVariables';
import { prepareQueryRangePayload } from 'lib/dashboard/prepareQueryRangePayload';
import history from 'lib/history';
import { mapQueryDataFromApi } from 'lib/newQueryBuilder/queryBuilderMappers/mapQueryDataFromApi';
import { useDashboard } from 'providers/Dashboard/Dashboard';
import { useCallback } from 'react';
import { useMutation } from 'react-query';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import { Widgets } from 'types/api/dashboard/getAll';
import { GlobalReducer } from 'types/reducer/globalTime';
import { getGraphType } from 'utils/getGraphType';

const useCreateAlerts = (widget?: Widgets): VoidFunction => {
	const queryRangeMutation = useMutation(getQueryRangeFormat);

	const { selectedTime: globalSelectedInterval } = useSelector<
		AppState,
		GlobalReducer
	>((state) => state.globalTime);

	const { notifications } = useNotifications();

	const { selectedDashboard } = useDashboard();

	return useCallback(() => {
		if (!widget) return;

		const { queryPayload } = prepareQueryRangePayload({
			query: widget.query,
			globalSelectedInterval,
			graphType: getGraphType(widget.panelTypes),
			selectedTime: widget.timePreferance,
			variables: getDashboardVariables(selectedDashboard?.data.variables),
		});
		queryRangeMutation.mutate(queryPayload, {
			onSuccess: (data) => {
				const updatedQuery = mapQueryDataFromApi(data.compositeQuery);

				history.push(
					`${ROUTES.ALERTS_NEW}?${QueryParams.compositeQuery}=${encodeURIComponent(
						JSON.stringify(updatedQuery),
					)}&${QueryParams.panelTypes}=${widget.panelTypes}&version=${
						selectedDashboard?.data.version || DEFAULT_ENTITY_VERSION
					}`,
				);
			},
			onError: () => {
				notifications.error({
					message: SOMETHING_WENT_WRONG,
				});
			},
		});
	}, [
		globalSelectedInterval,
		notifications,
		queryRangeMutation,
		selectedDashboard?.data.variables,
		selectedDashboard?.data.version,
		widget,
	]);
};

export default useCreateAlerts;
