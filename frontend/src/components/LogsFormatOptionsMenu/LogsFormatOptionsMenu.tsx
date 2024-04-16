/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import './LogsFormatOptionsMenu.styles.scss';

import { Divider, Input, InputNumber, Tooltip } from 'antd';
import cx from 'classnames';
import { LogViewMode } from 'container/LogsTable';
import { OptionsMenuConfig } from 'container/OptionsMenu/types';
import useDebouncedFn from 'hooks/useDebouncedFunction';
import { Check, Minus, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface LogsFormatOptionsMenuProps {
	title: string;
	items: any;
	selectedOptionFormat: any;
	config: OptionsMenuConfig;
}

export default function LogsFormatOptionsMenu({
	title,
	items,
	selectedOptionFormat,
	config,
}: LogsFormatOptionsMenuProps): JSX.Element {
	const { maxLines, format, addColumn } = config;
	const [selectedItem, setSelectedItem] = useState(selectedOptionFormat);
	const maxLinesNumber = (maxLines?.value as number) || 1;
	const [maxLinesPerRow, setMaxLinesPerRow] = useState<number>(maxLinesNumber);

	const [addNewColumn, setAddNewColumn] = useState(false);

	const onChange = useCallback(
		(key: LogViewMode) => {
			if (!format) return;

			format.onChange(key);
		},
		[format],
	);

	const handleMenuItemClick = (key: LogViewMode): void => {
		setSelectedItem(key);
		onChange(key);
		setAddNewColumn(false);
	};

	const incrementMaxLinesPerRow = (): void => {
		if (maxLinesPerRow < 10) {
			setMaxLinesPerRow(maxLinesPerRow + 1);
		}
	};

	const decrementMaxLinesPerRow = (): void => {
		if (maxLinesPerRow > 1) {
			setMaxLinesPerRow(maxLinesPerRow - 1);
		}
	};

	const handleSearchValueChange = useDebouncedFn((event): void => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const value = event?.target?.value || '';

		if (addColumn && addColumn?.onSearch) {
			addColumn?.onSearch(value);
		}
	}, 300);

	const handleToggleAddNewColumn = (): void => {
		setAddNewColumn(!addNewColumn);
	};

	const handleLinesPerRowChange = (maxLinesPerRow: number | null): void => {
		if (
			maxLinesPerRow &&
			Number.isInteger(maxLinesNumber) &&
			maxLinesPerRow > 1
		) {
			setMaxLinesPerRow(maxLinesPerRow);
		}
	};

	useEffect(() => {
		if (maxLinesPerRow && config && config.maxLines?.onChange) {
			config.maxLines.onChange(maxLinesPerRow);
		}
	}, [maxLinesPerRow]);

	return (
		<div
			className={cx('nested-menu-container', addNewColumn ? 'active' : '')}
			onClick={(event): void => {
				// this is to restrict click events to propogate to parent
				event.stopPropagation();
			}}
		>
			<div className="menu-container">
				<div className="title"> {title} </div>

				<div className="menu-items">
					{items.map(
						(item: any): JSX.Element => (
							<div
								className="item"
								key={item.label}
								onClick={(): void => handleMenuItemClick(item.key)}
							>
								<div className={cx('item-label')}>
									{item.label}

									{selectedItem === item.key && <Check size={12} />}
								</div>
							</div>
						),
					)}
				</div>
			</div>

			{selectedItem && (
				<>
					<>
						<div className="horizontal-line" />
						<div className="max-lines-per-row">
							<div className="title"> max lines per row </div>
							<div className="raw-format max-lines-per-row-input">
								<button
									type="button"
									className="periscope-btn"
									onClick={decrementMaxLinesPerRow}
								>
									{' '}
									<Minus size={12} />{' '}
								</button>
								<InputNumber
									min={1}
									max={10}
									value={maxLinesPerRow}
									onChange={handleLinesPerRowChange}
								/>
								<button
									type="button"
									className="periscope-btn"
									onClick={incrementMaxLinesPerRow}
								>
									{' '}
									<Plus size={12} />{' '}
								</button>
							</div>
						</div>
					</>

					<div className="selected-item-content-container active">
						{!addNewColumn && <div className="horizontal-line" />}

						{addNewColumn && (
							<div className="add-new-column-header">
								<div className="title">
									{' '}
									columns
									<X size={14} onClick={handleToggleAddNewColumn} />{' '}
								</div>

								<Input
									tabIndex={0}
									type="text"
									autoFocus
									onFocus={addColumn?.onFocus}
									onChange={handleSearchValueChange}
									placeholder="Search..."
								/>
							</div>
						)}

						<div className="item-content">
							{!addNewColumn && (
								<div className="title">
									columns
									<Plus size={14} onClick={handleToggleAddNewColumn} />{' '}
								</div>
							)}

							<div className="column-format">
								{addColumn?.value?.map(({ key, id }) => (
									<div className="column-name" key={id}>
										<div className="name">
											<Tooltip placement="left" title={key}>
												{key}
											</Tooltip>
										</div>
										<X
											className="delete-btn"
											size={14}
											onClick={(): void => addColumn.onRemove(id as string)}
										/>
									</div>
								))}
							</div>

							{addColumn?.isFetching && (
								<div className="loading-container"> Loading ... </div>
							)}

							{addNewColumn &&
								addColumn &&
								addColumn.value.length > 0 &&
								addColumn.options &&
								addColumn?.options?.length > 0 && (
									<Divider className="column-divider" />
								)}

							{addNewColumn && (
								<div className="column-format-new-options">
									{addColumn?.options?.map(({ label, value }) => (
										<div
											className="column-name"
											key={value}
											onClick={(eve): void => {
												eve.stopPropagation();

												if (addColumn && addColumn?.onSelect) {
													addColumn?.onSelect(value, { label, disabled: false });
												}
											}}
										>
											<div className="name">
												<Tooltip placement="left" title={label}>
													{label}
												</Tooltip>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	);
}
