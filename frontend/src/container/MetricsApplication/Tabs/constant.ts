import { Tags } from 'types/reducer/trace';

export const legend = '{{address}}';
export const dbSystemLegend = '{{db_system}}';

export const dbSystemTags: Tags[] = [
	{
		Key: 'db.system.(string)',
		StringValues: [''],
		NumberValues: [],
		BoolValues: [],
		Operator: 'Exists',
	},
];
