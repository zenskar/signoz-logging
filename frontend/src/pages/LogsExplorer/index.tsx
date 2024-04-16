import './LogsExplorer.styles.scss';

import ExplorerCard from 'components/ExplorerCard/ExplorerCard';
import LogExplorerQuerySection from 'container/LogExplorerQuerySection';
import LogsExplorerViews from 'container/LogsExplorerViews';
import LeftToolbarActions from 'container/QueryBuilder/components/ToolbarActions/LeftToolbarActions';
import RightToolbarActions from 'container/QueryBuilder/components/ToolbarActions/RightToolbarActions';
import Toolbar from 'container/Toolbar/Toolbar';
import { useQueryBuilder } from 'hooks/queryBuilder/useQueryBuilder';
import ErrorBoundaryFallback from 'pages/ErrorBoundaryFallback/ErrorBoundaryFallback';
import { useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { DataSource } from 'types/common/queryBuilder';

import { WrapperStyled } from './styles';
import { SELECTED_VIEWS } from './utils';

function LogsExplorer(): JSX.Element {
	const [showHistogram, setShowHistogram] = useState(true);
	const [selectedView, setSelectedView] = useState<SELECTED_VIEWS>(
		SELECTED_VIEWS.SEARCH,
	);

	const { handleRunQuery, currentQuery } = useQueryBuilder();

	const handleToggleShowHistogram = (): void => {
		setShowHistogram(!showHistogram);
	};

	const handleChangeSelectedView = (view: SELECTED_VIEWS): void => {
		setSelectedView(view);
	};

	// Switch to query builder view if there are more than 1 queries
	useEffect(() => {
		if (currentQuery.builder.queryData.length > 1) {
			handleChangeSelectedView(SELECTED_VIEWS.QUERY_BUILDER);
		}
	}, [currentQuery.builder.queryData.length]);

	const isMultipleQueries = useMemo(
		() =>
			currentQuery.builder.queryData.length > 1 ||
			currentQuery.builder.queryFormulas.length > 0,
		[currentQuery],
	);

	const toolbarViews = useMemo(
		() => ({
			search: {
				name: 'search',
				label: 'Search',
				disabled: isMultipleQueries,
				show: true,
			},
			queryBuilder: {
				name: 'query-builder',
				label: 'Query Builder',
				disabled: false,
				show: true,
			},
			clickhouse: {
				name: 'clickhouse',
				label: 'Clickhouse',
				disabled: false,
				show: false,
			},
		}),
		[isMultipleQueries],
	);

	return (
		<ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
			<Toolbar
				showAutoRefresh={false}
				leftActions={
					<LeftToolbarActions
						items={toolbarViews}
						selectedView={selectedView}
						onChangeSelectedView={handleChangeSelectedView}
						onToggleHistrogramVisibility={handleToggleShowHistogram}
						showHistogram={showHistogram}
					/>
				}
				rightActions={<RightToolbarActions onStageRunQuery={handleRunQuery} />}
				showOldCTA
			/>

			<WrapperStyled>
				<div className="log-explorer-query-container">
					<div>
						<ExplorerCard sourcepage={DataSource.LOGS}>
							<LogExplorerQuerySection selectedView={selectedView} />
						</ExplorerCard>
					</div>
					<div className="logs-explorer-views">
						<LogsExplorerViews
							selectedView={selectedView}
							showHistogram={showHistogram}
						/>
					</div>
				</div>
			</WrapperStyled>
		</ErrorBoundary>
	);
}

export default LogsExplorer;
