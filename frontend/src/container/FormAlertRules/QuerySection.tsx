import './QuerySection.styles.scss';

import { Button, Tabs, Tooltip } from 'antd';
import { ALERTS_DATA_SOURCE_MAP } from 'constants/alerts';
import { ENTITY_VERSION_V4 } from 'constants/app';
import { PANEL_TYPES } from 'constants/queryBuilder';
import { QBShortcuts } from 'constants/shortcuts/QBShortcuts';
import { QueryBuilder } from 'container/QueryBuilder';
import { useKeyboardHotkeys } from 'hooks/hotkeys/useKeyboardHotkeys';
import { Atom, Play, Terminal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import { AlertTypes } from 'types/api/alerts/alertTypes';
import { AlertDef } from 'types/api/alerts/def';
import { EQueryType } from 'types/common/dashboard';
import AppReducer from 'types/reducer/app';

import ChQuerySection from './ChQuerySection';
import PromqlSection from './PromqlSection';
import { FormContainer, StepHeading } from './styles';

function QuerySection({
	queryCategory,
	setQueryCategory,
	alertType,
	runQuery,
	alertDef,
	panelType,
}: QuerySectionProps): JSX.Element {
	// init namespace for translations
	const { t } = useTranslation('alerts');
	const [currentTab, setCurrentTab] = useState(queryCategory);

	const { featureResponse } = useSelector<AppState, AppReducer>(
		(state) => state.app,
	);

	const handleQueryCategoryChange = (queryType: string): void => {
		featureResponse.refetch().then(() => {
			setQueryCategory(queryType as EQueryType);
		});
		setCurrentTab(queryType as EQueryType);
	};

	const renderPromqlUI = (): JSX.Element => <PromqlSection />;

	const renderChQueryUI = (): JSX.Element => <ChQuerySection />;

	const renderMetricUI = (): JSX.Element => (
		<QueryBuilder
			panelType={panelType}
			config={{
				queryVariant: 'static',
				initialDataSource: ALERTS_DATA_SOURCE_MAP[alertType],
			}}
			showFunctions={
				(alertType === AlertTypes.METRICS_BASED_ALERT &&
					alertDef.version === ENTITY_VERSION_V4) ||
				alertType === AlertTypes.LOGS_BASED_ALERT
			}
			version={alertDef.version || 'v3'}
		/>
	);

	const tabs = [
		{
			label: (
				<Tooltip title="Query Builder">
					<Button className="nav-btns">
						<Atom size={14} />
					</Button>
				</Tooltip>
			),
			key: EQueryType.QUERY_BUILDER,
		},
		{
			label: (
				<Tooltip title="ClickHouse">
					<Button className="nav-btns">
						<Terminal size={14} />
					</Button>
				</Tooltip>
			),
			key: EQueryType.CLICKHOUSE,
		},
	];

	const items = useMemo(
		() => [
			{
				label: (
					<Tooltip title="Query Builder">
						<Button className="nav-btns">
							<Atom size={14} />
						</Button>
					</Tooltip>
				),
				key: EQueryType.QUERY_BUILDER,
			},
			{
				label: (
					<Tooltip title="ClickHouse">
						<Button className="nav-btns">
							<Terminal size={14} />
						</Button>
					</Tooltip>
				),
				key: EQueryType.CLICKHOUSE,
			},
			{
				label: (
					<Tooltip title="PromQL">
						<Button className="nav-btns">
							<img src="/Icons/promQL.svg" alt="Prom Ql" className="prom-ql-icon" />
						</Button>
					</Tooltip>
				),
				key: EQueryType.PROM,
			},
		],
		[],
	);

	const { registerShortcut, deregisterShortcut } = useKeyboardHotkeys();

	useEffect(() => {
		registerShortcut(QBShortcuts.StageAndRunQuery, runQuery);

		return (): void => {
			deregisterShortcut(QBShortcuts.StageAndRunQuery);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [runQuery]);

	const renderTabs = (typ: AlertTypes): JSX.Element | null => {
		switch (typ) {
			case AlertTypes.TRACES_BASED_ALERT:
			case AlertTypes.LOGS_BASED_ALERT:
			case AlertTypes.EXCEPTIONS_BASED_ALERT:
				return (
					<div className="alert-tabs">
						<Tabs
							type="card"
							style={{ width: '100%' }}
							defaultActiveKey={currentTab}
							activeKey={currentTab}
							onChange={handleQueryCategoryChange}
							tabBarExtraContent={
								<span style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
									<Button
										type="primary"
										onClick={runQuery}
										className="stage-run-query"
										icon={<Play size={14} />}
									>
										Stage & Run Query
									</Button>
								</span>
							}
							items={tabs}
						/>
					</div>
				);
			case AlertTypes.METRICS_BASED_ALERT:
			default:
				return (
					<div className="alert-tabs">
						<Tabs
							type="card"
							style={{ width: '100%' }}
							defaultActiveKey={currentTab}
							activeKey={currentTab}
							onChange={handleQueryCategoryChange}
							tabBarExtraContent={
								<span style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
									<Button
										type="primary"
										onClick={runQuery}
										className="stage-run-query"
										icon={<Play size={14} />}
									>
										Stage & Run Query
									</Button>
								</span>
							}
							items={items}
						/>
					</div>
				);
		}
	};
	const renderQuerySection = (c: EQueryType): JSX.Element | null => {
		switch (c) {
			case EQueryType.PROM:
				return renderPromqlUI();
			case EQueryType.CLICKHOUSE:
				return renderChQueryUI();
			case EQueryType.QUERY_BUILDER:
				return renderMetricUI();
			default:
				return null;
		}
	};
	return (
		<>
			<StepHeading> {t('alert_form_step1')}</StepHeading>
			<FormContainer>
				<div>{renderTabs(alertType)}</div>
				{renderQuerySection(currentTab)}
			</FormContainer>
		</>
	);
}

interface QuerySectionProps {
	queryCategory: EQueryType;
	setQueryCategory: (n: EQueryType) => void;
	alertType: AlertTypes;
	runQuery: VoidFunction;
	alertDef: AlertDef;
	panelType: PANEL_TYPES;
}

export default QuerySection;
