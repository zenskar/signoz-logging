import { UploadOutlined } from '@ant-design/icons';
import {
	Button,
	Divider,
	Input,
	InputNumber,
	Select,
	Space,
	Switch,
	Typography,
} from 'antd';
import InputComponent from 'components/Input';
import TimePreference from 'components/TimePreferenceDropDown';
import { PANEL_TYPES } from 'constants/queryBuilder';
import GraphTypes, {
	ItemsProps,
} from 'container/NewDashboard/ComponentsSlider/menuItems';
import useCreateAlerts from 'hooks/queryBuilder/useCreateAlerts';
import { useQueryBuilder } from 'hooks/queryBuilder/useQueryBuilder';
import {
	Dispatch,
	SetStateAction,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { Widgets } from 'types/api/dashboard/getAll';
import { DataSource } from 'types/common/queryBuilder';

import {
	panelTypeVsCreateAlert,
	panelTypeVsFillSpan,
	panelTypeVsPanelTimePreferences,
	panelTypeVsSoftMinMax,
	panelTypeVsThreshold,
	panelTypeVsYAxisUnit,
} from './constants';
import { Container, Title } from './styles';
import ThresholdSelector from './Threshold/ThresholdSelector';
import { ThresholdProps } from './Threshold/types';
import { timePreferance } from './timeItems';
import YAxisUnitSelector from './YAxisUnitSelector';

const { TextArea } = Input;
const { Option } = Select;

function RightContainer({
	description,
	setDescription,
	setTitle,
	title,
	selectedGraph,
	setSelectedTime,
	selectedTime,
	yAxisUnit,
	setYAxisUnit,
	setGraphHandler,
	thresholds,
	setThresholds,
	selectedWidget,
	isFillSpans,
	setIsFillSpans,
	softMax,
	softMin,
	setSoftMax,
	setSoftMin,
}: RightContainerProps): JSX.Element {
	const onChangeHandler = useCallback(
		(setFunc: Dispatch<SetStateAction<string>>, value: string) => {
			setFunc(value);
		},
		[],
	);

	const selectedGraphType =
		GraphTypes.find((e) => e.name === selectedGraph)?.display || '';

	const onCreateAlertsHandler = useCreateAlerts(selectedWidget);

	const allowThreshold = panelTypeVsThreshold[selectedGraph];
	const allowSoftMinMax = panelTypeVsSoftMinMax[selectedGraph];
	const allowFillSpans = panelTypeVsFillSpan[selectedGraph];
	const allowYAxisUnit = panelTypeVsYAxisUnit[selectedGraph];
	const allowCreateAlerts = panelTypeVsCreateAlert[selectedGraph];
	const allowPanelTimePreference =
		panelTypeVsPanelTimePreferences[selectedGraph];

	const { currentQuery } = useQueryBuilder();

	const [graphTypes, setGraphTypes] = useState<ItemsProps[]>(GraphTypes);

	useEffect(() => {
		const queryContainsMetricsDataSource = currentQuery.builder.queryData.some(
			(query) => query.dataSource === DataSource.METRICS,
		);

		if (queryContainsMetricsDataSource) {
			setGraphTypes((prev) =>
				prev.filter((graph) => graph.name !== PANEL_TYPES.LIST),
			);
		} else {
			setGraphTypes(GraphTypes);
		}
	}, [currentQuery]);

	const softMinHandler = useCallback(
		(value: number | null) => {
			setSoftMin(value);
		},
		[setSoftMin],
	);

	const softMaxHandler = useCallback(
		(value: number | null) => {
			setSoftMax(value);
		},
		[setSoftMax],
	);

	return (
		<Container>
			<Title>Panel Type</Title>
			<Select
				onChange={setGraphHandler}
				value={selectedGraph}
				style={{ width: '100%', marginBottom: 24 }}
			>
				{graphTypes.map((item) => (
					<Option key={item.name} value={item.name}>
						{item.display}
					</Option>
				))}
			</Select>
			<Title>Panel Attributes</Title>

			<InputComponent
				label="Panel Title"
				size="middle"
				placeholder="Title"
				labelOnTop
				onChangeHandler={(event): void =>
					onChangeHandler(setTitle, event.target.value)
				}
				value={title}
			/>

			<Title light="true">Description</Title>

			<TextArea
				placeholder="Write something describing the  panel"
				bordered
				allowClear
				value={description}
				onChange={(event): void =>
					onChangeHandler(setDescription, event.target.value)
				}
			/>

			{allowFillSpans && (
				<Space style={{ marginTop: 10 }} direction="vertical">
					<Typography>Fill gaps</Typography>

					<Switch
						checked={isFillSpans}
						onChange={(checked): void => setIsFillSpans(checked)}
					/>
				</Space>
			)}

			{allowPanelTimePreference && (
				<Title light="true">Panel Time Preference</Title>
			)}

			<Space direction="vertical">
				{allowPanelTimePreference && (
					<TimePreference
						{...{
							selectedTime,
							setSelectedTime,
						}}
					/>
				)}

				{allowYAxisUnit && (
					<YAxisUnitSelector
						defaultValue={yAxisUnit}
						onSelect={setYAxisUnit}
						fieldLabel={selectedGraphType === 'Value' ? 'Unit' : 'Y Axis Unit'}
					/>
				)}

				{allowCreateAlerts && (
					<Button icon={<UploadOutlined />} onClick={onCreateAlertsHandler}>
						Create Alerts from Queries
					</Button>
				)}
			</Space>

			{allowSoftMinMax && (
				<>
					<Divider />
					<Typography.Text style={{ display: 'block', margin: '5px 0' }}>
						Soft Min
					</Typography.Text>
					<InputNumber
						type="number"
						value={softMin}
						style={{ display: 'block', width: '100%' }}
						onChange={softMinHandler}
					/>
					<Typography.Text style={{ display: 'block', margin: '5px 0' }}>
						Soft Max
					</Typography.Text>
					<InputNumber
						value={softMax}
						type="number"
						style={{ display: 'block', width: '100%' }}
						onChange={softMaxHandler}
					/>
				</>
			)}

			{allowThreshold && (
				<>
					<Divider />
					<ThresholdSelector
						thresholds={thresholds}
						setThresholds={setThresholds}
						yAxisUnit={yAxisUnit}
						selectedGraph={selectedGraph}
					/>
				</>
			)}
		</Container>
	);
}

interface RightContainerProps {
	title: string;
	setTitle: Dispatch<SetStateAction<string>>;
	description: string;
	setDescription: Dispatch<SetStateAction<string>>;
	stacked: boolean;
	setStacked: Dispatch<SetStateAction<boolean>>;
	opacity: string;
	setOpacity: Dispatch<SetStateAction<string>>;
	selectedNullZeroValue: string;
	setSelectedNullZeroValue: Dispatch<SetStateAction<string>>;
	selectedGraph: PANEL_TYPES;
	setSelectedTime: Dispatch<SetStateAction<timePreferance>>;
	selectedTime: timePreferance;
	yAxisUnit: string;
	setYAxisUnit: Dispatch<SetStateAction<string>>;
	setGraphHandler: (type: PANEL_TYPES) => void;
	thresholds: ThresholdProps[];
	setThresholds: Dispatch<SetStateAction<ThresholdProps[]>>;
	selectedWidget?: Widgets;
	isFillSpans: boolean;
	setIsFillSpans: Dispatch<SetStateAction<boolean>>;
	softMin: number | null;
	softMax: number | null;
	setSoftMin: Dispatch<SetStateAction<number | null>>;
	setSoftMax: Dispatch<SetStateAction<number | null>>;
}

RightContainer.defaultProps = {
	selectedWidget: undefined,
};

export default RightContainer;
