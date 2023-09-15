import {
	CaretDownFilled,
	CaretUpFilled,
	LogoutOutlined,
} from '@ant-design/icons';
import { Button, Divider, MenuProps, Space, Typography } from 'antd';
import { Logout } from 'api/utils';
import ROUTES from 'constants/routes';
import Config from 'container/ConfigDropdown';
import { useIsDarkMode, useThemeMode } from 'hooks/useDarkMode';
import useLicense, { LICENSE_PLAN_STATUS } from 'hooks/useLicense';
import {
	Dispatch,
	KeyboardEvent,
	SetStateAction,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { AppState } from 'store/reducers';
import AppReducer from 'types/reducer/app';

import CurrentOrganization from './CurrentOrganization';
import ManageLicense from './ManageLicense';
import SignedIn from './SignedIn';
import {
	AvatarWrapper,
	Container,
	Header,
	IconContainer,
	LogoutContainer,
	NavLinkWrapper,
	ToggleButton,
	UserDropdown,
} from './styles';

function HeaderContainer(): JSX.Element {
	const { user, currentVersion } = useSelector<AppState, AppReducer>(
		(state) => state.app,
	);
	const isDarkMode = useIsDarkMode();
	const { toggleTheme } = useThemeMode();

	const [isUserDropDownOpen, setIsUserDropDownOpen] = useState<boolean>(false);

	const onToggleHandler = useCallback(
		(functionToExecute: Dispatch<SetStateAction<boolean>>) => (): void => {
			functionToExecute((state) => !state);
		},
		[],
	);

	const onLogoutKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Enter' || e.key === 'Space') {
			Logout();
		}
	}, []);

	const menu: MenuProps = useMemo(
		() => ({
			items: [
				{
					key: 'main-menu',
					label: (
						<div>
							<SignedIn onToggle={onToggleHandler(setIsUserDropDownOpen)} />
							<Divider />
							<CurrentOrganization onToggle={onToggleHandler(setIsUserDropDownOpen)} />
							<Divider />
							<ManageLicense onToggle={onToggleHandler(setIsUserDropDownOpen)} />
							<Divider />
							<LogoutContainer>
								<LogoutOutlined />
								<div
									tabIndex={0}
									onKeyDown={onLogoutKeyDown}
									role="button"
									onClick={Logout}
								>
									<Typography.Link>Logout</Typography.Link>
								</div>
							</LogoutContainer>
						</div>
					),
				},
			],
		}),
		[onToggleHandler, onLogoutKeyDown],
	);

	const onClickSignozCloud = (): void => {
		window.open(
			'https://signoz.io/oss-to-cloud/?utm_source=product_navbar&utm_medium=frontend&utm_campaign=oss_users',
			'_blank',
		);
	};

	const { data } = useLicense();

	const isLicenseActive =
		data?.payload?.find((e) => e.isCurrent)?.status === LICENSE_PLAN_STATUS.VALID;

	return (
		<Header>
			<Container>
				<NavLink to={ROUTES.APPLICATION}>
					<NavLinkWrapper>
						<img src={`/signoz.svg?currentVersion=${currentVersion}`} alt="SigNoz" />
						<Typography.Title
							style={{ margin: 0, color: 'rgb(219, 219, 219)' }}
							level={4}
						>
							SigNoz
						</Typography.Title>
					</NavLinkWrapper>
				</NavLink>

				<Space size="middle" align="center">
					{!isLicenseActive && (
						<Button onClick={onClickSignozCloud} type="primary">
							Try Signoz Cloud
						</Button>
					)}
					<Config frontendId="tooltip" />

					<ToggleButton
						checked={isDarkMode}
						onChange={toggleTheme}
						defaultChecked={isDarkMode}
						checkedChildren="🌜"
						unCheckedChildren="🌞"
					/>

					<UserDropdown
						onOpenChange={onToggleHandler(setIsUserDropDownOpen)}
						trigger={['click']}
						menu={menu}
						open={isUserDropDownOpen}
					>
						<Space>
							<AvatarWrapper shape="circle">{user?.name[0]}</AvatarWrapper>
							<IconContainer>
								{!isUserDropDownOpen ? <CaretDownFilled /> : <CaretUpFilled />}
							</IconContainer>
						</Space>
					</UserDropdown>
				</Space>
			</Container>
		</Header>
	);
}

export default HeaderContainer;
