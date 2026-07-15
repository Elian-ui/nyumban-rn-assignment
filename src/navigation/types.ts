export type RootStackParamList = {
  Login: undefined;
  Properties: undefined;
  PropertyDetail: { propertyId: string };
  Inspection: { propertyId: string };
  RoomInspection: {
    inspectionId: string;
    roomId: string;
    roomName: string;
  };
  SyncQueue: undefined;
  InspectionHistory: undefined;
};
