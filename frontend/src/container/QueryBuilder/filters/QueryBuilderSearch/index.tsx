import './QueryBuilderSearch.styles.scss';

import { Select, Spin, Tag, Tooltip } from 'antd';
import { OPERATORS } from 'constants/queryBuilder';
import { LogsExplorerShortcuts } from 'constants/shortcuts/logsExplorerShortcuts';
import { getDataTypes } from 'container/LogDetailedView/utils';
import { useKeyboardHotkeys } from 'hooks/hotkeys/useKeyboardHotkeys';
import {
	useAutoComplete,
	WhereClauseConfig,
} from 'hooks/queryBuilder/useAutoComplete';
import { useFetchKeysAndValues } from 'hooks/queryBuilder/useFetchKeysAndValues';
import { useQueryBuilder } from 'hooks/queryBuilder/useQueryBuilder';
import { isEqual } from 'lodash-es';
import type { BaseSelectRef } from 'rc-select';
import {
	KeyboardEvent,
	ReactElement,
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	BaseAutocompleteData,
	DataTypes,
} from 'types/api/queryBuilder/queryAutocompleteResponse';
import {
	IBuilderQuery,
	TagFilter,
} from 'types/api/queryBuilder/queryBuilderData';
import { DataSource } from 'types/common/queryBuilder';
import { popupContainer } from 'utils/selectPopupContainer';
import { v4 as uuid } from 'uuid';

import { selectStyle } from './config';
import { PLACEHOLDER } from './constant';
import OptionRenderer from './OptionRenderer';
import { StyledCheckOutlined, TypographyText } from './style';
import {
	getOperatorValue,
	getRemovePrefixFromKey,
	getTagToken,
	isExistsNotExistsOperator,
	isInNInOperator,
} from './utils';

function QueryBuilderSearch({
	query,
	onChange,
	whereClauseConfig,
	className,
	placeholder,
	suffixIcon,
}: QueryBuilderSearchProps): JSX.Element {
	const {
		updateTag,
		handleClearTag,
		handleKeyDown,
		handleOnBlur,
		handleSearch,
		handleSelect,
		tags,
		options,
		searchValue,
		isMulti,
		isFetching,
		setSearchKey,
		searchKey,
	} = useAutoComplete(query, whereClauseConfig);

	const [isOpen, setIsOpen] = useState<boolean>(false);
	const selectRef = useRef<BaseSelectRef>(null);
	const { sourceKeys, handleRemoveSourceKey } = useFetchKeysAndValues(
		searchValue,
		query,
		searchKey,
	);

	const { registerShortcut, deregisterShortcut } = useKeyboardHotkeys();

	const { handleRunQuery, currentQuery } = useQueryBuilder();

	const onTagRender = ({
		value,
		closable,
		onClose,
	}: CustomTagProps): ReactElement => {
		const { tagOperator } = getTagToken(value);
		const isInNin = isInNInOperator(tagOperator);
		const chipValue = isInNin
			? value?.trim()?.replace(/,\s*$/, '')
			: value?.trim();

		const onCloseHandler = (): void => {
			onClose();
			handleSearch('');
			setSearchKey('');
		};

		const tagEditHandler = (value: string): void => {
			updateTag(value);
			handleSearch(value);
		};

		const isDisabled = !!searchValue;

		return (
			<Tag closable={!searchValue && closable} onClose={onCloseHandler}>
				<Tooltip title={chipValue}>
					<TypographyText
						ellipsis
						$isInNin={isInNin}
						disabled={isDisabled}
						$isEnabled={!!searchValue}
						onClick={(): void => {
							if (!isDisabled) tagEditHandler(value);
						}}
					>
						{chipValue}
					</TypographyText>
				</Tooltip>
			</Tag>
		);
	};

	const onChangeHandler = (value: string[]): void => {
		if (!isMulti) handleSearch(value[value.length - 1]);
	};

	const onInputKeyDownHandler = (event: KeyboardEvent<Element>): void => {
		if (isMulti || event.key === 'Backspace') handleKeyDown(event);
		if (isExistsNotExistsOperator(searchValue)) handleKeyDown(event);

		if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
			event.preventDefault();
			event.stopPropagation();
			handleRunQuery();
			setIsOpen(false);
		}
	};

	const handleDeselect = useCallback(
		(deselectedItem: string) => {
			handleClearTag(deselectedItem);
			handleRemoveSourceKey(deselectedItem);
		},
		[handleClearTag, handleRemoveSourceKey],
	);

	const isMetricsDataSource = useMemo(
		() => query.dataSource === DataSource.METRICS,
		[query.dataSource],
	);

	const fetchValueDataType = (value: unknown, operator: string): DataTypes => {
		if (operator === OPERATORS.HAS || operator === OPERATORS.NHAS) {
			return getDataTypes([value]);
		}

		return DataTypes.EMPTY;
	};

	const queryTags = useMemo(() => {
		if (!query.aggregateAttribute.key && isMetricsDataSource) return [];
		return tags;
	}, [isMetricsDataSource, query.aggregateAttribute.key, tags]);

	useEffect(() => {
		const initialTagFilters: TagFilter = { items: [], op: 'AND' };
		const initialSourceKeys = query.filters.items?.map(
			(item) => item.key as BaseAutocompleteData,
		);

		initialTagFilters.items = tags.map((tag, index) => {
			const isJsonTrue = query.filters?.items[index]?.key?.isJSON;

			const { tagKey, tagOperator, tagValue } = getTagToken(tag);

			const filterAttribute = [...initialSourceKeys, ...sourceKeys].find(
				(key) => key.key === getRemovePrefixFromKey(tagKey),
			);

			const computedTagValue =
				tagValue && Array.isArray(tagValue) && tagValue[tagValue.length - 1] === ''
					? tagValue?.slice(0, -1)
					: tagValue ?? '';

			return {
				id: uuid().slice(0, 8),
				key: filterAttribute ?? {
					key: tagKey,
					dataType: fetchValueDataType(computedTagValue, tagOperator),
					type: '',
					isColumn: false,
					isJSON: isJsonTrue,
				},
				op: getOperatorValue(tagOperator),
				value: computedTagValue,
			};
		});

		onChange(initialTagFilters);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sourceKeys]);

	const isLastQuery = useMemo(
		() =>
			isEqual(
				currentQuery.builder.queryData[currentQuery.builder.queryData.length - 1],
				query,
			),
		[currentQuery, query],
	);

	useEffect(() => {
		if (isLastQuery) {
			registerShortcut(LogsExplorerShortcuts.FocusTheSearchBar, () => {
				// set timeout is needed here else the select treats the hotkey as input value
				setTimeout(() => {
					selectRef.current?.focus();
				}, 0);
			});
		}

		return (): void =>
			deregisterShortcut(LogsExplorerShortcuts.FocusTheSearchBar);
	}, [deregisterShortcut, isLastQuery, registerShortcut]);

	return (
		<div
			style={{
				position: 'relative',
			}}
		>
			<Select
				ref={selectRef}
				getPopupContainer={popupContainer}
				virtual
				showSearch
				tagRender={onTagRender}
				filterOption={false}
				open={isOpen}
				onDropdownVisibleChange={setIsOpen}
				autoClearSearchValue={false}
				mode="multiple"
				placeholder={placeholder}
				value={queryTags}
				searchValue={searchValue}
				className={className}
				rootClassName="query-builder-search"
				disabled={isMetricsDataSource && !query.aggregateAttribute.key}
				style={selectStyle}
				onSearch={handleSearch}
				onChange={onChangeHandler}
				onSelect={handleSelect}
				onDeselect={handleDeselect}
				onInputKeyDown={onInputKeyDownHandler}
				notFoundContent={isFetching ? <Spin size="small" /> : null}
				suffixIcon={suffixIcon}
				showAction={['focus']}
				onBlur={handleOnBlur}
			>
				{options.map((option) => (
					<Select.Option key={option.label} value={option.value}>
						<OptionRenderer
							label={option.label}
							value={option.value}
							dataType={option.dataType || ''}
						/>
						{option.selected && <StyledCheckOutlined />}
					</Select.Option>
				))}
			</Select>
		</div>
	);
}

interface QueryBuilderSearchProps {
	query: IBuilderQuery;
	onChange: (value: TagFilter) => void;
	whereClauseConfig?: WhereClauseConfig;
	className?: string;
	placeholder?: string;
	suffixIcon?: React.ReactNode;
}

QueryBuilderSearch.defaultProps = {
	whereClauseConfig: undefined,
	className: '',
	placeholder: PLACEHOLDER,
	suffixIcon: undefined,
};

export interface CustomTagProps {
	label: ReactNode;
	value: string;
	disabled: boolean;
	onClose: () => void;
	closable: boolean;
}

export default QueryBuilderSearch;
