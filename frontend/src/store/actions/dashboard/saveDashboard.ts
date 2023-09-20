import { notification } from 'antd';
import updateDashboardApi from 'api/dashboard/update';
import { AxiosError } from 'axios';
import { QueryParams } from 'constants/query';
import { PANEL_TYPES } from 'constants/queryBuilder';
import ROUTES from 'constants/routes';
import { updateStepInterval } from 'hooks/queryBuilder/useStepInterval';
import history from 'lib/history';
import { Layout } from 'react-grid-layout';
import { generatePath } from 'react-router-dom';
import { Dispatch } from 'redux';
import store from 'store';
import AppActions from 'types/actions';
import { Dashboard, Widgets } from 'types/api/dashboard/getAll';
import { v4 } from 'uuid';

export const SaveDashboard = ({
	uuid,
	description,
	isStacked,
	nullZeroValues,
	opacity,
	timePreferance,
	title,
	widgetId,
	dashboardId,
	yAxisUnit,
	graphType,
}: SaveDashboardProps): ((dispatch: Dispatch<AppActions>) => void) =>
	// eslint-disable-next-line sonarjs/cognitive-complexity
	async (dispatch: Dispatch<AppActions>): Promise<void> => {
		try {
			const dashboard = store.getState();

			const selectedDashboard = dashboard.dashboards.dashboards.find(
				(e) => e.uuid === uuid,
			);

			if (selectedDashboard === undefined) {
				throw new Error('Dashboard Not Found');
			}

			const { data } = selectedDashboard;

			const updatedTitle = title;
			const updatedDescription = description;
			const updatedisStacked = isStacked;
			const updatednullZeroValues = nullZeroValues;
			const updatedopacity = opacity;
			const updatedtimePreferance = timePreferance;
			const updatedYAxisUnit = yAxisUnit;

			const selectedWidgetIndex = data.widgets?.findIndex(
				(e) => e.id === widgetId,
			);

			const isEmptyWidget = widgetId === 'empty';

			const emptyLayoutIndex = data.layout?.findIndex((e) => e.i === 'empty');

			const newWidgetId = v4();

			const preWidget = data.widgets?.slice(0, selectedWidgetIndex) || [];

			const afterWidget =
				data.widgets?.slice(
					(selectedWidgetIndex || 0) + 1, // this is never undefined
					data.widgets?.length,
				) || [];

			const selectedWidget = (selectedDashboard.data.widgets || [])[
				selectedWidgetIndex || 0
			];

			const getAllLayout = (): Layout[] => {
				const allLayout = data.layout || [];

				// empty layout is not present
				if (emptyLayoutIndex === -1 || emptyLayoutIndex === undefined) {
					return allLayout;
				}

				return [
					...allLayout.slice(0, emptyLayoutIndex),
					{ ...allLayout[emptyLayoutIndex], i: newWidgetId },
					...allLayout.slice(emptyLayoutIndex + 1, allLayout.length),
				];
			};
			const allLayout = getAllLayout();
			const params = new URLSearchParams(window.location.search);
			const compositeQuery = params.get(QueryParams.compositeQuery);
			const { maxTime, minTime } = store.getState().globalTime;
			const query = compositeQuery
				? updateStepInterval(
						JSON.parse(decodeURIComponent(compositeQuery)),
						maxTime,
						minTime,
				  )
				: updateStepInterval(selectedWidget.query, maxTime, minTime);

			const response = await updateDashboardApi({
				data: {
					...selectedDashboard.data,
					// this is the data for the dashboard
					title: selectedDashboard.data.title,
					description: selectedDashboard.data.description,
					tags: selectedDashboard.data.tags,
					name: selectedDashboard.data.name,
					layout: allLayout,
					// as we are updated the widget only
					widgets: [
						...preWidget,
						{
							...selectedWidget,
							query,
							description: updatedDescription,
							id: isEmptyWidget ? newWidgetId : widgetId,
							isStacked: updatedisStacked,
							nullZeroValues: updatednullZeroValues,
							opacity: updatedopacity,
							title: updatedTitle,
							timePreferance: updatedtimePreferance,
							yAxisUnit: updatedYAxisUnit,
							panelTypes: graphType,
						},
						...afterWidget,
					],
				},
				uuid,
			});

			if (response.statusCode === 200) {
				dispatch({
					type: 'SAVE_SETTING_TO_PANEL_SUCCESS',
					payload: response.payload,
				});
				history.push(generatePath(ROUTES.DASHBOARD, { dashboardId }));
			} else {
				const error = 'Something went wrong';

				notification.error({
					message: response.error || error,
				});

				dispatch({
					type: 'SAVE_SETTING_TO_PANEL_ERROR',
					payload: {
						errorMessage: response.error || error,
					},
				});
			}
		} catch (error) {
			dispatch({
				type: 'SAVE_SETTING_TO_PANEL_ERROR',
				payload: {
					errorMessage: (error as AxiosError).toString() || 'Something went wrong',
				},
			});
		}
	};

export interface SaveDashboardProps {
	uuid: Dashboard['uuid'];
	title: Widgets['title'];
	description: Widgets['description'];
	opacity: Widgets['opacity'];
	isStacked: Widgets['isStacked'];
	timePreferance: Widgets['timePreferance'];
	nullZeroValues: Widgets['nullZeroValues'];
	widgetId: Widgets['id'];
	dashboardId: string;
	yAxisUnit: Widgets['yAxisUnit'];
	graphType: PANEL_TYPES;
}
