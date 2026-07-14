export type RootStackParamList = {
  Login: undefined;
  Properties: undefined;
  PropertyDetail: { propertyId: string };
  Inspection: { propertyId: string };
  RoomInspection: { roomId: string; roomName: string };
  SyncQueue: undefined;
};
