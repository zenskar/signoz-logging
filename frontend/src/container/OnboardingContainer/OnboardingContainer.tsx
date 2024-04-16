/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import './Onboarding.styles.scss';

import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Card, Typography } from 'antd';
import getIngestionData from 'api/settings/getIngestionData';
import cx from 'classnames';
import ROUTES from 'constants/routes';
import FullScreenHeader from 'container/FullScreenHeader/FullScreenHeader';
import useAnalytics from 'hooks/analytics/useAnalytics';
import { useIsDarkMode } from 'hooks/useDarkMode';
import history from 'lib/history';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { useEffectOnce } from 'react-use';

import ModuleStepsContainer from './common/ModuleStepsContainer/ModuleStepsContainer';
import { stepsMap } from './constants/stepsConfig';
import {
	OnboardingMethods,
	useOnboardingContext,
} from './context/OnboardingContext';
import { DataSourceType } from './Steps/DataSource/DataSource';
import {
	defaultApplicationDataSource,
	defaultAwsServices,
	defaultInfraMetricsType,
	defaultLogsType,
	moduleRouteMap,
} from './utils/dataSourceUtils';
import {
	APM_STEPS,
	AWS_MONITORING_STEPS,
	getSteps,
	INFRASTRUCTURE_MONITORING_STEPS,
	LOGS_MANAGEMENT_STEPS,
} from './utils/getSteps';

export enum ModulesMap {
	APM = 'APM',
	LogsManagement = 'LogsManagement',
	InfrastructureMonitoring = 'InfrastructureMonitoring',
	AwsMonitoring = 'AwsMonitoring',
}

export interface ModuleProps {
	id: string;
	title: string;
	desc: string;
}

export interface SelectedModuleStepProps {
	id: string;
	title: string;
	component: any;
}

export const useCases = {
	APM: {
		id: ModulesMap.APM,
		title: 'Application Monitoring',
		desc:
			'Monitor application metrics like p99 latency, error rates, external API calls, and db calls.',
	},
	LogsManagement: {
		id: ModulesMap.LogsManagement,
		title: 'Logs Management',
		desc:
			'Easily filter and query logs, build dashboards and alerts based on attributes in logs',
	},
	InfrastructureMonitoring: {
		id: ModulesMap.InfrastructureMonitoring,
		title: 'Infrastructure Monitoring',
		desc:
			'Monitor Kubernetes infrastructure metrics, hostmetrics, or metrics of any third-party integration',
	},
	AwsMonitoring: {
		id: ModulesMap.AwsMonitoring,
		title: 'AWS Monitoring',
		desc:
			'Monitor your traces, logs and metrics for AWS services like EC2, ECS, EKS etc.',
	},
};

export default function Onboarding(): JSX.Element {
	const [selectedModule, setSelectedModule] = useState<ModuleProps>(
		useCases.APM,
	);

	const [selectedModuleSteps, setSelectedModuleSteps] = useState(APM_STEPS);
	const [activeStep, setActiveStep] = useState(1);
	const [current, setCurrent] = useState(0);
	const isDarkMode = useIsDarkMode();
	const { trackEvent } = useAnalytics();
	const { location } = history;

	const {
		selectedDataSource,
		selectedEnvironment,
		selectedMethod,
		updateSelectedModule,
		updateSelectedDataSource,
		resetProgress,
		updateActiveStep,
		updateIngestionData,
	} = useOnboardingContext();

	useEffectOnce(() => {
		trackEvent('Onboarding V2 Started');
	});

	const { status, data: ingestionData } = useQuery({
		queryFn: () => getIngestionData(),
	});

	useEffect(() => {
		if (
			status === 'success' &&
			ingestionData &&
			ingestionData &&
			Array.isArray(ingestionData.payload)
		) {
			const payload = ingestionData.payload[0] || {
				ingestionKey: '',
				dataRegion: '',
			};

			updateIngestionData({
				SIGNOZ_INGESTION_KEY: payload?.ingestionKey,
				REGION: payload?.dataRegion,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [status, ingestionData?.payload]);

	const setModuleStepsBasedOnSelectedDataSource = (
		selectedDataSource: DataSourceType | null,
	): void => {
		if (selectedDataSource) {
			let steps: SelectedModuleStepProps[] = [];

			steps = getSteps({
				selectedDataSource,
			});

			setSelectedModuleSteps(steps);
		}
	};

	const removeStep = (
		stepToRemove: string,
		steps: SelectedModuleStepProps[],
	): SelectedModuleStepProps[] =>
		steps.filter((step) => step.id !== stepToRemove);

	const handleAPMSteps = (): void => {
		if (selectedEnvironment === 'kubernetes') {
			const updatedSteps = removeStep(stepsMap.selectMethod, APM_STEPS);
			setSelectedModuleSteps(updatedSteps);

			return;
		}

		if (selectedMethod === OnboardingMethods.QUICK_START) {
			const updatedSteps = removeStep(stepsMap.setupOtelCollector, APM_STEPS);
			setSelectedModuleSteps(updatedSteps);

			return;
		}

		setSelectedModuleSteps(APM_STEPS);
	};

	useEffect(() => {
		if (selectedModule?.id === ModulesMap.InfrastructureMonitoring) {
			if (selectedDataSource) {
				setModuleStepsBasedOnSelectedDataSource(selectedDataSource);
			} else {
				setSelectedModuleSteps(INFRASTRUCTURE_MONITORING_STEPS);
				updateSelectedDataSource(defaultInfraMetricsType);
			}
		} else if (selectedModule?.id === ModulesMap.LogsManagement) {
			if (selectedDataSource) {
				setModuleStepsBasedOnSelectedDataSource(selectedDataSource);
			} else {
				setSelectedModuleSteps(LOGS_MANAGEMENT_STEPS);
				updateSelectedDataSource(defaultLogsType);
			}
		} else if (selectedModule?.id === ModulesMap.AwsMonitoring) {
			if (selectedDataSource) {
				setModuleStepsBasedOnSelectedDataSource(selectedDataSource);
			} else {
				setSelectedModuleSteps(AWS_MONITORING_STEPS);
				updateSelectedDataSource(defaultAwsServices);
			}
		} else if (selectedModule?.id === ModulesMap.APM) {
			handleAPMSteps();

			if (!selectedDataSource) {
				updateSelectedDataSource(defaultApplicationDataSource);
			}
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedModule, selectedDataSource, selectedEnvironment, selectedMethod]);

	const handleNextStep = (): void => {
		if (activeStep <= 3) {
			const nextStep = activeStep + 1;

			// on next
			trackEvent('Onboarding V2: Get Started', {
				selectedModule: selectedModule.id,
				nextStepId: nextStep,
			});

			setActiveStep(nextStep);
			setCurrent(current + 1);

			// set the active step info
			updateActiveStep({
				module: selectedModule,
				step: selectedModuleSteps[current],
			});
		}
	};

	const handleNext = (): void => {
		if (activeStep <= 3) {
			handleNextStep();
			history.replace(moduleRouteMap[selectedModule.id as ModulesMap]);
		}
	};

	const handleModuleSelect = (module: ModuleProps): void => {
		setSelectedModule(module);
		updateSelectedModule(module);
		updateSelectedDataSource(null);
	};

	useEffect(() => {
		if (location.pathname === ROUTES.GET_STARTED_APPLICATION_MONITORING) {
			handleModuleSelect(useCases.APM);
			updateSelectedDataSource(defaultApplicationDataSource);
			handleNextStep();
		} else if (
			location.pathname === ROUTES.GET_STARTED_INFRASTRUCTURE_MONITORING
		) {
			handleModuleSelect(useCases.InfrastructureMonitoring);
			handleNextStep();
		} else if (location.pathname === ROUTES.GET_STARTED_LOGS_MANAGEMENT) {
			handleModuleSelect(useCases.LogsManagement);
			handleNextStep();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className={cx('container', isDarkMode ? 'darkMode' : 'lightMode')}>
			{activeStep === 1 && (
				<>
					<FullScreenHeader />
					<div className="onboardingHeader">
						<h1> Select a use-case to get started</h1>
					</div>
					<div className="modulesContainer">
						<div className="moduleContainerRowStyles">
							{Object.keys(ModulesMap).map((module) => {
								const selectedUseCase = (useCases as any)[module];

								return (
									<Card
										className={cx(
											'moduleStyles',
											selectedModule.id === selectedUseCase.id ? 'selected' : '',
										)}
										style={{
											backgroundColor: isDarkMode ? '#000' : '#FFF',
										}}
										key={selectedUseCase.id}
										onClick={(): void => handleModuleSelect(selectedUseCase)}
									>
										<Typography.Title
											className="moduleTitleStyle"
											level={4}
											style={{
												borderBottom: isDarkMode ? '1px solid #303030' : '1px solid #ddd',
												backgroundColor: isDarkMode ? '#141414' : '#FFF',
											}}
										>
											{selectedUseCase.title}
										</Typography.Title>
										<Typography.Paragraph
											className="moduleDesc"
											style={{ backgroundColor: isDarkMode ? '#000' : '#FFF' }}
										>
											{selectedUseCase.desc}
										</Typography.Paragraph>
									</Card>
								);
							})}
						</div>
					</div>
					<div className="continue-to-next-step">
						<Button type="primary" icon={<ArrowRightOutlined />} onClick={handleNext}>
							Get Started
						</Button>
					</div>
				</>
			)}

			{activeStep > 1 && (
				<div className="stepsContainer">
					<ModuleStepsContainer
						onReselectModule={(): void => {
							setCurrent(current - 1);
							setActiveStep(activeStep - 1);
							setSelectedModule(useCases.APM);
							resetProgress();
							history.push(ROUTES.GET_STARTED);
						}}
						selectedModule={selectedModule}
						selectedModuleSteps={selectedModuleSteps}
					/>
				</div>
			)}
		</div>
	);
}
