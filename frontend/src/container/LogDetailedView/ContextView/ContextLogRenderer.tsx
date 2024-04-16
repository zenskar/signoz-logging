import './ContextLogRenderer.styles.scss';

import { Skeleton } from 'antd';
import RawLogView from 'components/Logs/RawLogView';
import ShowButton from 'container/LogsContextList/ShowButton';
import { ORDERBY_FILTERS } from 'container/QueryBuilder/filters/OrderByFilter/config';
import { useCallback, useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { ILog } from 'types/api/logs/log';
import { Query, TagFilter } from 'types/api/queryBuilder/queryBuilderData';

import { useContextLogData } from './useContextLogData';

function ContextLogRenderer({
	isEdit,
	query,
	log,
	filters,
}: ContextLogRendererProps): JSX.Element {
	const [prevLogPage, setPrevLogPage] = useState<number>(1);
	const [afterLogPage, setAfterLogPage] = useState<number>(1);
	const [logs, setLogs] = useState<ILog[]>([log]);

	const {
		logs: previousLogs,
		isFetching: isPreviousLogsFetching,
		handleShowNextLines: handlePreviousLogsShowNextLine,
	} = useContextLogData({
		log,
		filters,
		isEdit,
		query,
		order: ORDERBY_FILTERS.ASC,
		page: prevLogPage,
		setPage: setPrevLogPage,
	});

	const {
		logs: afterLogs,
		isFetching: isAfterLogsFetching,
		handleShowNextLines: handleAfterLogsShowNextLine,
	} = useContextLogData({
		log,
		filters,
		isEdit,
		query,
		order: ORDERBY_FILTERS.DESC,
		page: afterLogPage,
		setPage: setAfterLogPage,
	});

	useEffect(() => {
		setLogs((prev) => [...previousLogs, ...prev]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [previousLogs]);

	useEffect(() => {
		setLogs((prev) => [...prev, ...afterLogs]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [afterLogs]);

	useEffect(() => {
		setLogs([log]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters]);

	const getItemContent = useCallback(
		(_: number, logTorender: ILog): JSX.Element => (
			<RawLogView
				isActiveLog={logTorender.id === log.id}
				isReadOnly
				isTextOverflowEllipsisDisabled
				key={logTorender.id}
				data={logTorender}
				linesPerRow={1}
			/>
		),
		[log.id],
	);

	return (
		<div className="context-log-renderer">
			<ShowButton
				isLoading={isPreviousLogsFetching}
				isDisabled={false}
				order={ORDERBY_FILTERS.ASC}
				onClick={handlePreviousLogsShowNextLine}
			/>
			{isPreviousLogsFetching && (
				<Skeleton
					style={{
						height: '100%',
						padding: '16px',
					}}
				/>
			)}
			<Virtuoso
				className="virtuoso-list"
				initialTopMostItemIndex={0}
				data={logs}
				itemContent={getItemContent}
				style={{ height: `calc(${logs.length} * 32px)` }}
			/>
			{isAfterLogsFetching && (
				<Skeleton
					style={{
						height: '100%',
						padding: '16px',
					}}
				/>
			)}
			<ShowButton
				isLoading={isAfterLogsFetching}
				isDisabled={false}
				order={ORDERBY_FILTERS.DESC}
				onClick={handleAfterLogsShowNextLine}
			/>
		</div>
	);
}

interface ContextLogRendererProps {
	isEdit: boolean;
	query: Query;
	log: ILog;
	filters: TagFilter | null;
}

export default ContextLogRenderer;
