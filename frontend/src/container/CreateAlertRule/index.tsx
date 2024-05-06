import { Form, Row } from 'antd';
import { ENTITY_VERSION_V4 } from 'constants/app';
import FormAlertRules from 'container/FormAlertRules';
import { useGetCompositeQueryParam } from 'hooks/queryBuilder/useGetCompositeQueryParam';
import { isEqual } from 'lodash-es';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTypes } from 'types/api/alerts/alertTypes';
import { AlertDef } from 'types/api/alerts/def';

import { ALERT_TYPE_VS_SOURCE_MAPPING } from './config';
import {
	alertDefaults,
	exceptionAlertDefaults,
	logAlertDefaults,
	traceAlertDefaults,
} from './defaults';
import SelectAlertType from './SelectAlertType';

function CreateRules(): JSX.Element {
	const [initValues, setInitValues] = useState<AlertDef | null>(null);
	const [alertType, setAlertType] = useState<AlertTypes>();

	const location = useLocation();
	const queryParams = new URLSearchParams(location.search);
	const version = queryParams.get('version');

	const compositeQuery = useGetCompositeQueryParam();

	const [formInstance] = Form.useForm();

	const onSelectType = (typ: AlertTypes): void => {
		setAlertType(typ);
		switch (typ) {
			case AlertTypes.LOGS_BASED_ALERT:
				setInitValues(logAlertDefaults);
				break;
			case AlertTypes.TRACES_BASED_ALERT:
				setInitValues(traceAlertDefaults);
				break;
			case AlertTypes.EXCEPTIONS_BASED_ALERT:
				setInitValues(exceptionAlertDefaults);
				break;
			default:
				setInitValues({
					...alertDefaults,
					version: version || ENTITY_VERSION_V4,
				});
		}
	};

	useEffect(() => {
		if (!compositeQuery) {
			return;
		}
		const dataSource = compositeQuery?.builder?.queryData[0]?.dataSource;

		const alertTypeFromQuery = ALERT_TYPE_VS_SOURCE_MAPPING[dataSource];

		if (alertTypeFromQuery && !isEqual(alertType, alertTypeFromQuery)) {
			onSelectType(alertTypeFromQuery);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [compositeQuery]);

	if (!initValues) {
		return (
			<Row wrap={false}>
				<SelectAlertType onSelect={onSelectType} />
			</Row>
		);
	}

	return (
		<FormAlertRules
			alertType={alertType}
			formInstance={formInstance}
			initialValue={initValues}
			ruleId={0}
		/>
	);
}

export default CreateRules;
