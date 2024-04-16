import './RawLogView.styles.scss';

import Convert from 'ansi-to-html';
import { DrawerProps } from 'antd';
import LogDetail from 'components/LogDetail';
import { VIEW_TYPES, VIEWS } from 'components/LogDetail/constants';
import LogsExplorerContext from 'container/LogsExplorerContext';
import dayjs from 'dayjs';
import dompurify from 'dompurify';
import { useActiveLog } from 'hooks/logs/useActiveLog';
import { useCopyLogLink } from 'hooks/logs/useCopyLogLink';
// hooks
import { useIsDarkMode } from 'hooks/useDarkMode';
import { FlatLogData } from 'lib/logs/flatLogData';
import { isEmpty, isNumber, isUndefined } from 'lodash-es';
import {
	KeyboardEvent,
	MouseEvent,
	MouseEventHandler,
	useCallback,
	useMemo,
	useState,
} from 'react';

import LogLinesActionButtons from '../LogLinesActionButtons/LogLinesActionButtons';
import LogStateIndicator from '../LogStateIndicator/LogStateIndicator';
import { getLogIndicatorType } from '../LogStateIndicator/utils';
// styles
import { RawLogContent, RawLogViewContainer } from './styles';
import { RawLogViewProps } from './types';

const convert = new Convert();

function RawLogView({
	isActiveLog,
	isReadOnly,
	data,
	linesPerRow,
	isTextOverflowEllipsisDisabled,
	selectedFields = [],
}: RawLogViewProps): JSX.Element {
	const { isHighlighted, isLogsExplorerPage, onLogCopy } = useCopyLogLink(
		data.id,
	);
	const flattenLogData = useMemo(() => FlatLogData(data), [data]);

	const {
		activeLog: activeContextLog,
		onClearActiveLog: handleClearActiveContextLog,
	} = useActiveLog();
	const {
		activeLog,
		onSetActiveLog,
		onClearActiveLog,
		onAddToQuery,
	} = useActiveLog();

	const [hasActionButtons, setHasActionButtons] = useState<boolean>(false);
	const [selectedTab, setSelectedTab] = useState<VIEWS | undefined>();

	const isDarkMode = useIsDarkMode();
	const isReadOnlyLog = !isLogsExplorerPage || isReadOnly;

	const severityText = data.severity_text ? `${data.severity_text} |` : '';

	const logType = getLogIndicatorType(data);

	const updatedSelecedFields = useMemo(
		() => selectedFields.filter((e) => e.name !== 'id'),
		[selectedFields],
	);

	const attributesValues = updatedSelecedFields
		.map((field) => flattenLogData[field.name])
		.filter((attribute) => {
			// loadash isEmpty doesnot work with numbers
			if (isNumber(attribute)) {
				return true;
			}

			return !isUndefined(attribute) && !isEmpty(attribute);
		});

	let attributesText = attributesValues.join(' | ');

	if (attributesText.length > 0) {
		attributesText += ' | ';
	}

	const text = useMemo(
		() =>
			typeof data.timestamp === 'string'
				? `${dayjs(data.timestamp).format()} | ${attributesText} ${severityText} ${
						data.body
				  }`
				: `${dayjs(
						data.timestamp / 1e6,
				  ).format()} | ${attributesText} ${severityText} ${data.body}`,
		[data.timestamp, data.body, severityText, attributesText],
	);

	const handleClickExpand = useCallback(() => {
		if (activeContextLog || isReadOnly) return;

		onSetActiveLog(data);
		setSelectedTab(VIEW_TYPES.OVERVIEW);
	}, [activeContextLog, isReadOnly, data, onSetActiveLog]);

	const handleCloseLogDetail: DrawerProps['onClose'] = useCallback(
		(
			event: MouseEvent<Element, globalThis.MouseEvent> | KeyboardEvent<Element>,
		) => {
			event.preventDefault();
			event.stopPropagation();

			onClearActiveLog();
			setSelectedTab(undefined);
		},
		[onClearActiveLog],
	);

	const handleMouseEnter = useCallback(() => {
		if (isReadOnlyLog) return;

		setHasActionButtons(true);
	}, [isReadOnlyLog]);

	const handleMouseLeave = useCallback(() => {
		if (isReadOnlyLog) return;

		setHasActionButtons(false);
	}, [isReadOnlyLog]);

	const handleShowContext: MouseEventHandler<HTMLElement> = useCallback(
		(event) => {
			event.preventDefault();
			event.stopPropagation();
			// handleSetActiveContextLog(data);
			setSelectedTab(VIEW_TYPES.CONTEXT);
			onSetActiveLog(data);
		},
		[data, onSetActiveLog],
	);

	const html = useMemo(
		() => ({
			__html: convert.toHtml(dompurify.sanitize(text)),
		}),
		[text],
	);

	return (
		<RawLogViewContainer
			onClick={handleClickExpand}
			wrap={false}
			align="middle"
			$isDarkMode={isDarkMode}
			$isReadOnly={isReadOnly}
			$isHightlightedLog={isHighlighted}
			$isActiveLog={isActiveLog}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<LogStateIndicator
				type={logType}
				isActive={
					activeLog?.id === data.id ||
					activeContextLog?.id === data.id ||
					isActiveLog
				}
			/>

			<RawLogContent
				$isReadOnly={isReadOnly}
				$isActiveLog={isActiveLog}
				$isDarkMode={isDarkMode}
				$isTextOverflowEllipsisDisabled={isTextOverflowEllipsisDisabled}
				linesPerRow={linesPerRow}
				dangerouslySetInnerHTML={html}
			/>

			{hasActionButtons && (
				<LogLinesActionButtons
					handleShowContext={handleShowContext}
					onLogCopy={onLogCopy}
				/>
			)}

			{activeContextLog && (
				<LogsExplorerContext
					log={activeContextLog}
					onClose={handleClearActiveContextLog}
				/>
			)}
			{selectedTab && (
				<LogDetail
					selectedTab={selectedTab}
					log={activeLog}
					onClose={handleCloseLogDetail}
					onAddToQuery={onAddToQuery}
					onClickActionItem={onAddToQuery}
				/>
			)}
		</RawLogViewContainer>
	);
}

RawLogView.defaultProps = {
	isActiveLog: false,
	isReadOnly: false,
	isTextOverflowEllipsisDisabled: false,
};

export default RawLogView;
