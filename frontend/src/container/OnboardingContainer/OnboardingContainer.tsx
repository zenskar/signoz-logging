/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import './Onboarding.styles.scss';

import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Button, Card, StepProps, Steps, Typography } from 'antd';
import cx from 'classnames';
import ROUTES from 'constants/routes';
import { useIsDarkMode } from 'hooks/useDarkMode';
import history from 'lib/history';
import { useEffect, useState } from 'react';

import APM from './APM/APM';
import InfrastructureMonitoring from './InfrastructureMonitoring/InfrastructureMonitoring';
import LogsManagement from './LogsManagement/LogsManagement';

enum ModulesMap {
	APM = 'APM',
	LogsManagement = 'LogsManagement',
	InfrastructureMonitoring = 'InfrastructureMonitoring',
}

const defaultStepDesc = 'Configure data source';
const getStarted = 'Get Started';
const selectUseCase = 'Select the use-case';
const instrumentApp = 'Instrument Application';
const testConnection = 'Test Connection';
const verifyConnectionDesc = 'Verify that you’ve instrumented your application';

const verifyableLogsType = ['kubernetes', 'docker'];

interface ModuleProps {
	id: string;
	title: string;
	desc: string;
	stepDesc: string;
}

const useCases = {
	APM: {
		id: ModulesMap.APM,
		title: 'Application Monitoring',
		desc:
			'Monitor performance of your applications & troubleshoot problems by installing within your infra.',
		stepDesc: defaultStepDesc,
	},
	LogsManagement: {
		id: ModulesMap.LogsManagement,
		title: 'Logs Management',
		desc:
			'Easily search and filter logs with query builder and automatically detect logs from K8s cluster.',
		stepDesc: 'Choose the logs that you want to receive on SigNoz',
	},
	InfrastructureMonitoring: {
		id: ModulesMap.InfrastructureMonitoring,
		title: 'Infrastructure Monitoring',
		desc:
			'Easily search and filter logs with query builder and automatically detect logs from K8s cluster.',
		stepDesc: defaultStepDesc,
	},
};

const defaultSteps: StepProps[] = [
	{
		title: getStarted,
		description: selectUseCase,
	},
	{
		title: instrumentApp,
		description: defaultStepDesc,
	},
	{
		title: testConnection,
		description: verifyConnectionDesc,
	},
];

export default function Onboarding(): JSX.Element {
	const [selectedModule, setSelectedModule] = useState<ModuleProps>(
		useCases.APM,
	);
	const [steps, setsteps] = useState(defaultSteps);
	const [activeStep, setActiveStep] = useState(1);
	const [current, setCurrent] = useState(0);
	const [selectedLogsType, setSelectedLogsType] = useState<string | null>(
		'kubernetes',
	);
	const isDarkMode = useIsDarkMode();

	const baseSteps = [
		{
			title: getStarted,
			description: selectUseCase,
		},
		{
			title: instrumentApp,
			description: selectedModule.stepDesc,
		},
	];

	useEffect(() => {
		if (selectedModule?.id === ModulesMap.InfrastructureMonitoring) {
			setsteps([...baseSteps]);
		} else if (selectedModule?.id === ModulesMap.LogsManagement) {
			if (selectedLogsType && verifyableLogsType?.indexOf(selectedLogsType) > -1) {
				setsteps([
					...baseSteps,
					{
						title: testConnection,
						description: verifyConnectionDesc,
						disabled: true,
					},
				]);
			} else {
				setsteps([...baseSteps]);
			}
		} else {
			setsteps([
				...baseSteps,
				{
					title: testConnection,
					description: verifyConnectionDesc,
				},
			]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedModule, selectedLogsType]);

	const handleNext = (): void => {
		// Need to add logic to validate service name and then allow next step transition in APM module
		const isFormValid = true;

		if (isFormValid && activeStep <= 3) {
			setActiveStep(activeStep + 1);
			setCurrent(current + 1);
		}
	};

	const handlePrev = (): void => {
		if (activeStep >= 1) {
			setCurrent(current - 1);
			setActiveStep(activeStep - 1);
		}
	};

	const handleOnboardingComplete = (): void => {
		switch (selectedModule.id) {
			case ModulesMap.APM:
				history.push(ROUTES.APPLICATION);
				break;
			case ModulesMap.LogsManagement:
				history.push(ROUTES.LOGS);
				break;
			case ModulesMap.InfrastructureMonitoring:
				history.push(ROUTES.APPLICATION);
				break;
			default:
				break;
		}
	};

	const handleStepChange = (value: number): void => {
		setCurrent(value);
		setActiveStep(value + 1);
	};

	const handleModuleSelect = (module: ModuleProps): void => {
		setSelectedModule(module);
	};

	const handleLogTypeSelect = (logType: string): void => {
		setSelectedLogsType(logType);
	};

	return (
		<div className={cx('container', isDarkMode ? 'darkMode' : 'lightMode')}>
			{activeStep === 1 && (
				<>
					<div className="onboardingHeader">
						<h1>Get Started with SigNoz</h1>
						<div> Select a use-case to get started </div>
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
							Continue to next step
						</Button>
					</div>
				</>
			)}

			{activeStep > 1 && (
				<div className="stepsContainer">
					<Steps
						current={current}
						onChange={handleStepChange}
						items={steps}
						size="small"
					/>
					<div className="step-content">
						{selectedModule.id === ModulesMap.APM && <APM activeStep={activeStep} />}
						{selectedModule.id === ModulesMap.LogsManagement && (
							<LogsManagement
								activeStep={activeStep}
								handleLogTypeSelect={handleLogTypeSelect}
							/>
						)}
						{selectedModule.id === ModulesMap.InfrastructureMonitoring && (
							<InfrastructureMonitoring activeStep={activeStep} />
						)}
					</div>

					<div className="actionButtonsContainer">
						{activeStep > 0 && (
							<Button icon={<ArrowLeftOutlined />} onClick={handlePrev}>
								Back
							</Button>
						)}

						{activeStep < steps.length && (
							<Button
								type="primary"
								icon={<ArrowRightOutlined />}
								onClick={handleNext}
							>
								Continue to next step
							</Button>
						)}

						{activeStep === steps.length && (
							<Button type="primary" onClick={handleOnboardingComplete}>
								Done
							</Button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
