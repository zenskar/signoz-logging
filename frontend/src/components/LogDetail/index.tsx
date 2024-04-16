/* eslint-disable sonarjs/cognitive-complexity */
import './LogDetails.styles.scss';

import { Color, Spacing } from '@signozhq/design-tokens';
import { Button, Divider, Drawer, Radio, Tooltip, Typography } from 'antd';
import { RadioChangeEvent } from 'antd/lib';
import cx from 'classnames';
import { LogType } from 'components/Logs/LogStateIndicator/LogStateIndicator';
import ContextView from 'container/LogDetailedView/ContextView/ContextView';
import JSONView from 'container/LogDetailedView/JsonView';
import Overview from 'container/LogDetailedView/Overview';
import { aggregateAttributesResourcesToString } from 'container/LogDetailedView/utils';
import { useIsDarkMode } from 'hooks/useDarkMode';
import { useNotifications } from 'hooks/useNotifications';
import {
	Braces,
	Copy,
	Filter,
	HardHat,
	Table,
	TextSelect,
	X,
} from 'lucide-react';
import { useState } from 'react';
import { useCopyToClipboard } from 'react-use';
import { Query, TagFilter } from 'types/api/queryBuilder/queryBuilderData';

import { VIEW_TYPES, VIEWS } from './constants';
import { LogDetailProps } from './LogDetail.interfaces';
import QueryBuilderSearchWrapper from './QueryBuilderSearchWrapper';

function LogDetail({
	log,
	onClose,
	onAddToQuery,
	onClickActionItem,
	selectedTab,
	isListViewPanel = false,
}: LogDetailProps): JSX.Element {
	const [, copyToClipboard] = useCopyToClipboard();
	const [selectedView, setSelectedView] = useState<VIEWS>(selectedTab);

	const [isFilterVisibile, setIsFilterVisible] = useState<boolean>(false);

	const [contextQuery, setContextQuery] = useState<Query | undefined>();
	const [filters, setFilters] = useState<TagFilter | null>(null);
	const [isEdit, setIsEdit] = useState<boolean>(false);

	const isDarkMode = useIsDarkMode();

	const { notifications } = useNotifications();

	const LogJsonData = log ? aggregateAttributesResourcesToString(log) : '';

	const handleModeChange = (e: RadioChangeEvent): void => {
		setSelectedView(e.target.value);
		setIsEdit(false);
		setIsFilterVisible(false);
	};

	const handleFilterVisible = (): void => {
		setIsFilterVisible(!isFilterVisibile);
		setIsEdit(!isEdit);
	};

	const drawerCloseHandler = (
		e: React.MouseEvent | React.KeyboardEvent,
	): void => {
		if (onClose) {
			onClose(e);
		}
	};

	const handleJSONCopy = (): void => {
		copyToClipboard(LogJsonData);
		notifications.success({
			message: 'Copied to clipboard',
		});
	};

	if (!log) {
		// eslint-disable-next-line react/jsx-no-useless-fragment
		return <></>;
	}

	const logType = log?.attributes_string?.log_level || LogType.INFO;

	return (
		<Drawer
			width="60%"
			title={
				<>
					<Divider type="vertical" className={cx('log-type-indicator', LogType)} />
					<Typography.Text className="title">Log details</Typography.Text>
				</>
			}
			placement="right"
			// closable
			onClose={drawerCloseHandler}
			open={log !== null}
			style={{
				overscrollBehavior: 'contain',
				background: isDarkMode ? Color.BG_INK_400 : Color.BG_VANILLA_100,
			}}
			className="log-detail-drawer"
			destroyOnClose
			closeIcon={<X size={16} style={{ marginTop: Spacing.MARGIN_1 }} />}
		>
			<div className="log-detail-drawer__log">
				<Divider type="vertical" className={cx('log-type-indicator', logType)} />
				<Tooltip title={log?.body} placement="left">
					<Typography.Text className="log-body">{log?.body}</Typography.Text>
				</Tooltip>

				<div className="log-overflow-shadow">&nbsp;</div>
			</div>

			<div className="tabs-and-search">
				<Radio.Group
					className="views-tabs"
					onChange={handleModeChange}
					value={selectedView}
				>
					<Radio.Button
						className={
							// eslint-disable-next-line sonarjs/no-duplicate-string
							selectedView === VIEW_TYPES.OVERVIEW ? 'selected_view tab' : 'tab'
						}
						value={VIEW_TYPES.OVERVIEW}
					>
						<div className="view-title">
							<Table size={14} />
							Overview
						</div>
					</Radio.Button>
					<Radio.Button
						className={selectedView === VIEW_TYPES.JSON ? 'selected_view tab' : 'tab'}
						value={VIEW_TYPES.JSON}
					>
						<div className="view-title">
							<Braces size={14} />
							JSON
						</div>
					</Radio.Button>
					<Radio.Button
						className={
							selectedView === VIEW_TYPES.CONTEXT ? 'selected_view tab' : 'tab'
						}
						value={VIEW_TYPES.CONTEXT}
					>
						<div className="view-title">
							<TextSelect size={14} />
							Context
						</div>
					</Radio.Button>
				</Radio.Group>

				{selectedView === VIEW_TYPES.JSON && (
					<div className="json-action-btn">
						<Button
							className="action-btn"
							icon={<Copy size={16} />}
							onClick={handleJSONCopy}
						/>
					</div>
				)}

				{selectedView === VIEW_TYPES.CONTEXT && (
					<Button
						className="action-btn"
						icon={<Filter size={16} />}
						onClick={handleFilterVisible}
					/>
				)}
			</div>

			<QueryBuilderSearchWrapper
				isEdit={isEdit}
				log={log}
				filters={filters}
				setContextQuery={setContextQuery}
				setFilters={setFilters}
				contextQuery={contextQuery}
				suffixIcon={
					<HardHat size={12} style={{ paddingRight: Spacing.PADDING_2 }} />
				}
			/>

			{selectedView === VIEW_TYPES.OVERVIEW && (
				<Overview
					logData={log}
					onAddToQuery={onAddToQuery}
					onClickActionItem={onClickActionItem}
					isListViewPanel={isListViewPanel}
				/>
			)}
			{selectedView === VIEW_TYPES.JSON && <JSONView logData={log} />}

			{selectedView === VIEW_TYPES.CONTEXT && (
				<ContextView
					log={log}
					filters={filters}
					contextQuery={contextQuery}
					isEdit={isEdit}
				/>
			)}
		</Drawer>
	);
}

export default LogDetail;
