import './ConnectionStatus.styles.scss';

import {
	CheckCircleTwoTone,
	CloseCircleTwoTone,
	LoadingOutlined,
} from '@ant-design/icons';
import Header from 'container/OnboardingContainer/common/Header/Header';
import { useQueryService } from 'hooks/useQueryService';
import useResourceAttribute from 'hooks/useResourceAttribute';
import { convertRawQueriesToTraceSelectedTags } from 'hooks/useResourceAttribute/utils';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import { UPDATE_TIME_INTERVAL } from 'types/actions/globalTime';
import { PayloadProps as QueryServicePayloadProps } from 'types/api/metrics/getService';
import { GlobalReducer } from 'types/reducer/globalTime';
import { Tags } from 'types/reducer/trace';

interface ConnectionStatusProps {
	serviceName: string;
	language: string;
	framework: string;
}

const pollingInterval = 15000;

export default function ConnectionStatus({
	serviceName,
	language,
	framework,
}: ConnectionStatusProps): JSX.Element {
	const { minTime, maxTime, selectedTime } = useSelector<
		AppState,
		GlobalReducer
	>((state) => state.globalTime);
	const { queries } = useResourceAttribute();
	const selectedTags = useMemo(
		() => (convertRawQueriesToTraceSelectedTags(queries) as Tags[]) || [],
		[queries],
	);

	const [retryCount, setRetryCount] = useState(20); // Retry for 5 mins
	const [loading, setLoading] = useState(true);
	const [isReceivingData, setIsReceivingData] = useState(false);
	const dispatch = useDispatch();

	const {
		data,
		error,
		isFetching: isServiceLoading,
		isError,
		refetch,
	} = useQueryService({
		minTime,
		maxTime,
		selectedTime,
		selectedTags,
	});

	const renderDocsReference = (): JSX.Element => {
		switch (language) {
			case 'java':
				return (
					<Header
						entity="java"
						heading="Java OpenTelemetry Instrumentation"
						imgURL="/Logos/java.png"
						docsURL="https://signoz.io/docs/instrumentation/java/"
						imgClassName="supported-language-img"
					/>
				);

			case 'python':
				return (
					<Header
						entity="python"
						heading="Python OpenTelemetry Instrumentation"
						imgURL="/Logos/python.png"
						docsURL="https://signoz.io/docs/instrumentation/python/"
						imgClassName="supported-language-img"
					/>
				);

			case 'javascript':
				return (
					<Header
						entity="javascript"
						heading="Javascript OpenTelemetry Instrumentation"
						imgURL="/Logos/javascript.png"
						docsURL="https://signoz.io/docs/instrumentation/javascript/"
						imgClassName="supported-language-img"
					/>
				);
			case 'go':
				return (
					<Header
						entity="go"
						heading="Go OpenTelemetry Instrumentation"
						imgURL="/Logos/go.png"
						docsURL="https://signoz.io/docs/instrumentation/golang/"
						imgClassName="supported-language-img"
					/>
				);

			default:
				return <> </>;
		}
	};

	const verifyApplicationData = (response?: QueryServicePayloadProps): void => {
		if (data || isError) {
			setRetryCount(retryCount - 1);
			if (retryCount < 0) {
				setLoading(false);
			}
		}

		if (response && Array.isArray(response)) {
			for (let i = 0; i < response.length; i += 1) {
				if (response[i]?.serviceName === serviceName) {
					setLoading(false);
					setIsReceivingData(true);

					break;
				}
			}
		}
	};

	// Use useEffect to update query parameters when the polling interval lapses
	useEffect(() => {
		const pollingTimer = setInterval(() => {
			// Trigger a refetch with the updated parameters
			const updatedMinTime = (Date.now() - 15 * 60 * 1000) * 1000000;
			const updatedMaxTime = Date.now() * 1000000;

			const payload = {
				maxTime: updatedMaxTime,
				minTime: updatedMinTime,
				selectedTime,
			};

			dispatch({
				type: UPDATE_TIME_INTERVAL,
				payload,
			});

			// refetch(updatedParams);
		}, pollingInterval); // Same interval as pollingInterval

		// Clean up the interval when the component unmounts
		return (): void => {
			clearInterval(pollingTimer);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refetch, selectedTags, selectedTime]);

	useEffect(() => {
		verifyApplicationData(data);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isServiceLoading, data, error, isError]);

	useEffect(() => {
		refetch();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className="connection-status-container">
			<div className="full-docs-link">{renderDocsReference()}</div>
			<div className="status-container">
				<div className="service-info">
					<div className="label"> Service Name </div>
					<div className="language">{serviceName}</div>
				</div>

				<div className="language-info">
					<div className="label"> Language - Framework </div>
					<div className="language">
						{language} - {framework}
					</div>
				</div>

				<div className="status-info">
					<div className="label"> Status </div>

					<div className="status">
						{(loading || isServiceLoading) && <LoadingOutlined />}
						{!(loading || isServiceLoading) && isReceivingData && (
							<>
								<CheckCircleTwoTone twoToneColor="#52c41a" />
								<span> Success </span>
							</>
						)}
						{!(loading || isServiceLoading) && !isReceivingData && (
							<>
								<CloseCircleTwoTone twoToneColor="#e84749" />
								<span> Failed </span>
							</>
						)}
					</div>
				</div>
				<div className="details-info">
					<div className="label"> Details </div>

					<div className="details">
						{(loading || isServiceLoading) && <div> Waiting for Update </div>}
						{!(loading || isServiceLoading) && isReceivingData && (
							<div> Received data from the application successfully. </div>
						)}
						{!(loading || isServiceLoading) && !isReceivingData && (
							<div> Could not detect the install </div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
