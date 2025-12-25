
import { View, DataSourceMode } from './types';

export const VIEW: { [key: string]: View } = {
    PASSENGER: 'passenger',
    STAFF: 'staff',
    MANAGEMENT: 'management',
};

export const DATA_SOURCE_MODE: { [key: string]: DataSourceMode } = {
    EXCEL: 'excel',
    WORLDTRACER: 'worldtracer',
};
