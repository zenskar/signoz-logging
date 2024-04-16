import { getToolTipValue } from 'components/Graph/yAxisConfig';
import { themeColors } from 'constants/theme';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import getLabelName from 'lib/getLabelName';
import { get } from 'lodash-es';
import { MetricRangePayloadProps } from 'types/api/metrics/getQueryRange';

import { placement } from '../placement';
import { generateColor } from '../utils/generateColor';

dayjs.extend(customParseFormat);

interface UplotTooltipDataProps {
	show: boolean;
	color: string;
	label: string;
	focus: boolean;
	value: number;
	tooltipValue: string;
	textContent: string;
	queryName: string;
}

const generateTooltipContent = (
	seriesList: any[],
	data: any[],
	idx: number,
	yAxisUnit?: string,
	series?: uPlot.Options['series'],
	isBillingUsageGraphs?: boolean,
	// eslint-disable-next-line sonarjs/cognitive-complexity
): HTMLElement => {
	const container = document.createElement('div');
	container.classList.add('tooltip-container');
	const overlay = document.getElementById('overlay');
	let tooltipCount = 0;

	let tooltipTitle = '';
	const formattedData: Record<string, UplotTooltipDataProps> = {};
	const duplicatedLegendLabels: Record<string, true> = {};

	function sortTooltipContentBasedOnValue(
		tooltipDataObj: Record<string, UplotTooltipDataProps>,
	): Record<string, UplotTooltipDataProps> {
		const entries = Object.entries(tooltipDataObj);
		entries.sort((a, b) => b[1].value - a[1].value);
		return Object.fromEntries(entries);
	}

	if (Array.isArray(series) && series.length > 0) {
		series.forEach((item, index) => {
			if (index === 0) {
				if (isBillingUsageGraphs) {
					tooltipTitle = dayjs(data[0][idx] * 1000).format('MMM DD YYYY');
				} else {
					tooltipTitle = dayjs(data[0][idx] * 1000).format('MMM DD YYYY HH:mm:ss');
				}
			} else if (item.show) {
				const {
					metric = {},
					queryName = '',
					legend = '',
					quantity = [],
					unit = '',
				} = seriesList[index - 1] || {};

				const value = data[index][idx];
				const dataIngested = quantity[idx];
				const label = getLabelName(metric, queryName || '', legend || '');

				let color = generateColor(label, themeColors.chartcolors);

				// in case of billing graph pick colors from the series options
				if (isBillingUsageGraphs) {
					let clr;
					series.forEach((item) => {
						if (item.label === label) {
							clr = get(item, '_fill');
						}
					});
					color = clr ?? color;
				}

				let tooltipItemLabel = label;

				if (Number.isFinite(value)) {
					const tooltipValue = getToolTipValue(value, yAxisUnit);
					const dataIngestedFormated = getToolTipValue(dataIngested);
					if (
						duplicatedLegendLabels[label] ||
						Object.prototype.hasOwnProperty.call(formattedData, label)
					) {
						duplicatedLegendLabels[label] = true;
						const tempDataObj = formattedData[label];

						if (tempDataObj) {
							const newLabel = `${tempDataObj.queryName}: ${tempDataObj.label}`;

							tempDataObj.textContent = `${newLabel} : ${tempDataObj.tooltipValue}`;

							formattedData[newLabel] = tempDataObj;

							delete formattedData[label];
						}

						tooltipItemLabel = `${queryName}: ${label}`;
					}

					const dataObj = {
						show: item.show || false,
						color,
						label,
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						focus: item?._focus || false,
						value,
						tooltipValue,
						queryName,
						textContent: isBillingUsageGraphs
							? `${tooltipItemLabel} : $${tooltipValue} - ${dataIngestedFormated} ${unit}`
							: `${tooltipItemLabel} : ${tooltipValue}`,
					};

					tooltipCount += 1;

					formattedData[tooltipItemLabel] = dataObj;
				}
			}
		});
	}

	// Show tooltip only if atleast only series has a value at the hovered timestamp
	if (tooltipCount <= 0) {
		if (overlay && overlay.style.display === 'block') {
			overlay.style.display = 'none';
		}

		return container;
	}

	const sortedData: Record<
		string,
		UplotTooltipDataProps
	> = sortTooltipContentBasedOnValue(formattedData);

	const div = document.createElement('div');
	div.classList.add('tooltip-content-row');
	div.textContent = tooltipTitle;
	div.classList.add('tooltip-content-header');
	container.appendChild(div);

	const sortedKeys = Object.keys(sortedData);

	if (Array.isArray(sortedKeys) && sortedKeys.length > 0) {
		sortedKeys.forEach((key) => {
			if (sortedData[key]) {
				const { textContent, color, focus } = sortedData[key];
				const div = document.createElement('div');
				div.classList.add('tooltip-content-row');
				div.classList.add('tooltip-content');
				const squareBox = document.createElement('div');
				squareBox.classList.add('pointSquare');

				squareBox.style.borderColor = color;

				const text = document.createElement('div');
				text.classList.add('tooltip-data-point');

				text.textContent = textContent;
				text.style.color = color;

				if (focus) {
					text.classList.add('focus');
				} else {
					text.classList.remove('focus');
				}

				div.appendChild(squareBox);
				div.appendChild(text);

				container.appendChild(div);
			}
		});
	}

	if (overlay && overlay.style.display === 'none') {
		overlay.style.display = 'block';
	}

	return container;
};

const tooltipPlugin = (
	apiResponse: MetricRangePayloadProps | undefined,
	yAxisUnit?: string,
	isBillingUsageGraphs?: boolean,
): any => {
	let over: HTMLElement;
	let bound: HTMLElement;
	let bLeft: any;
	let bTop: any;

	const syncBounds = (): void => {
		const bbox = over.getBoundingClientRect();
		bLeft = bbox.left;
		bTop = bbox.top;
	};

	let overlay = document.getElementById('overlay');

	if (!overlay) {
		overlay = document.createElement('div');
		overlay.id = 'overlay';
		overlay.style.display = 'none';
		overlay.style.position = 'absolute';
		document.body.appendChild(overlay);
	}

	const apiResult = apiResponse?.data?.result || [];

	return {
		hooks: {
			init: (u: any): void => {
				over = u?.over;
				bound = over;
				over.onmouseenter = (): void => {
					if (overlay) {
						overlay.style.display = 'block';
					}
				};
				over.onmouseleave = (): void => {
					if (overlay) {
						overlay.style.display = 'none';
					}
				};
			},
			setSize: (): void => {
				syncBounds();
			},
			setCursor: (u: {
				cursor: { left: any; top: any; idx: any };
				data: any[];
				series: uPlot.Options['series'];
			}): void => {
				if (overlay) {
					overlay.textContent = '';
					const { left, top, idx } = u.cursor;

					if (Number.isInteger(idx)) {
						const anchor = { left: left + bLeft, top: top + bTop };
						const content = generateTooltipContent(
							apiResult,
							u.data,
							idx,
							yAxisUnit,
							u.series,
							isBillingUsageGraphs,
						);
						overlay.appendChild(content);
						placement(overlay, anchor, 'right', 'start', { bound });
					}
				}
			},
		},
	};
};

export default tooltipPlugin;
