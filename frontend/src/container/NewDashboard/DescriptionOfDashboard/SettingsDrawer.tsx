import { SettingOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useState } from 'react';

import DashboardSettingsContent from '../DashboardSettings';
import { DrawerContainer } from './styles';

function SettingsDrawer(): JSX.Element {
	const [visible, setVisible] = useState<boolean>(false);

	const showDrawer = (): void => {
		setVisible(true);
	};

	const onClose = (): void => {
		setVisible(false);
	};

	return (
		<>
			<Button type="dashed" onClick={showDrawer}>
				<SettingOutlined /> Configure
			</Button>
			<DrawerContainer
				placement="right"
				width="70%"
				onClose={onClose}
				open={visible}
			>
				<DashboardSettingsContent />
			</DrawerContainer>
		</>
	);
}

export default SettingsDrawer;
