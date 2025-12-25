
import { BaggageInfo, BaggageRecord, BaggageEvent } from '../types';

export const recordToBaggageInfo = (record: BaggageRecord): BaggageInfo => {
    const history: BaggageEvent[] = [];

    if (record.History_1_Timestamp) {
        history.push({
            timestamp: record.History_1_Timestamp, status: record.History_1_Status,
            location: record.History_1_Location, details: record.History_1_Details
        });
    }
     if (record.History_2_Timestamp) {
        history.push({
            timestamp: record.History_2_Timestamp, status: record.History_2_Status,
            location: record.History_2_Location, details: record.History_2_Details
        });
    }
     if (record.History_3_Timestamp) {
        history.push({
            timestamp: record.History_3_Timestamp, status: record.History_3_Status,
            location: record.History_3_Location, details: record.History_3_Details
        });
    }

    const isConfirmed = 
        record.IsConfirmedByPassenger === true || 
        record.IsConfirmedByPassenger === 'TRUE';

    return {
        pir: record.PIR,
        status: record.Status,
        currentLocation: record.CurrentLocation,
        nextStep: record.NextStep,
        estimatedArrival: record.EstimatedArrival,
        history: history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        baggagePhotoUrl: record.BaggagePhotoUrl,
        baggagePhotoUrl_2: record.BaggagePhotoUrl_2,
        passengerPhotoUrl: record.PassengerPhotoUrl,
        isConfirmedByPassenger: isConfirmed,
    };
};
