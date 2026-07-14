export interface Agent {
  id: string;
  displayName: string;
  assignedRegion: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  agent: Agent;
}
