/* eslint-disable sonarjs/no-duplicate-string */
import './QBEntityOptions.styles.scss';

import { Button, Col, Tooltip } from 'antd';
import { noop } from 'antd/lib/_util/warning';
import cx from 'classnames';
import { isFunction } from 'lodash-es';
import {
	ChevronDown,
	ChevronRight,
	Copy,
	Eye,
	EyeOff,
	Trash2,
} from 'lucide-react';
import {
	IBuilderQuery,
	QueryFunctionProps,
} from 'types/api/queryBuilder/queryBuilderData';
import { DataSource } from 'types/common/queryBuilder';

import QueryFunctions from '../QueryFunctions/QueryFunctions';

interface QBEntityOptionsProps {
	query?: IBuilderQuery;
	isMetricsDataSource?: boolean;
	showFunctions?: boolean;
	isCollapsed: boolean;
	entityType: string;
	entityData: any;
	onDelete: () => void;
	onCloneQuery?: (type: string, query: IBuilderQuery) => void;
	onToggleVisibility: () => void;
	onCollapseEntity: () => void;
	onQueryFunctionsUpdates?: (functions: QueryFunctionProps[]) => void;
	showDeleteButton: boolean;
	isListViewPanel?: boolean;
}

export default function QBEntityOptions({
	query,
	isMetricsDataSource,
	isCollapsed,
	showFunctions,
	entityType,
	entityData,
	onDelete,
	onCloneQuery,
	onToggleVisibility,
	onCollapseEntity,
	showDeleteButton,
	onQueryFunctionsUpdates,
	isListViewPanel,
}: QBEntityOptionsProps): JSX.Element {
	const handleCloneEntity = (): void => {
		if (isFunction(onCloneQuery)) {
			onCloneQuery(entityType, entityData);
		}
	};

	const isLogsDataSource = query?.dataSource === DataSource.LOGS;

	return (
		<Col span={24}>
			<div className="qb-entity-options">
				<div className="left-col-items">
					<div className="options periscope-btn-group">
						<Button.Group>
							<Button
								value="search"
								className="periscope-btn collapse"
								onClick={onCollapseEntity}
							>
								{isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
							</Button>
							<Button
								value="query-builder"
								className="periscope-btn visibility-toggle"
								onClick={onToggleVisibility}
								disabled={isListViewPanel}
							>
								{entityData.disabled ? <EyeOff size={16} /> : <Eye size={16} />}
							</Button>

							{entityType === 'query' && (
								<Tooltip title={`Clone Query ${entityData.queryName}`}>
									<Button className={cx('periscope-btn')} onClick={handleCloneEntity}>
										<Copy size={14} />
									</Button>
								</Tooltip>
							)}

							<Button
								className={cx(
									'periscope-btn',
									entityType === 'query' ? 'query-name' : 'formula-name',
								)}
							>
								{entityData.queryName}
							</Button>

							{showFunctions &&
								(isMetricsDataSource || isLogsDataSource) &&
								query &&
								onQueryFunctionsUpdates && (
									<QueryFunctions
										query={query}
										queryFunctions={query.functions || []}
										key={query.functions?.toString()}
										onChange={onQueryFunctionsUpdates}
										maxFunctions={isLogsDataSource ? 1 : 3}
									/>
								)}
						</Button.Group>
					</div>

					{isCollapsed && (
						<div className="title">
							<span className="entityType"> {entityType} </span> -{' '}
							<span className="entityData"> {entityData.queryName} </span>
						</div>
					)}
				</div>

				{showDeleteButton && (
					<Button className="periscope-btn ghost" onClick={onDelete}>
						<Trash2 size={14} />
					</Button>
				)}
			</div>
		</Col>
	);
}

QBEntityOptions.defaultProps = {
	isListViewPanel: false,
	query: undefined,
	isMetricsDataSource: false,
	onQueryFunctionsUpdates: undefined,
	showFunctions: false,
	onCloneQuery: noop,
};
