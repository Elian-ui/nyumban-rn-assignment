import Config from 'react-native-config';

const DEFAULT_API_BASE_URL =
  'https://nyumban-assessment-0000d50c027d.herokuapp.com';

export const environment = {
  apiBaseUrl: Config.API_BASE_URL || DEFAULT_API_BASE_URL,
  assessmentKey: Config.ASSESSMENT_KEY || '',
};

export function requireAssessmentKey(): string {
  if (!environment.assessmentKey) {
    throw new Error(
      'Missing ASSESSMENT_KEY. Copy .env.example to .env and add your key.',
    );
  }

  return environment.assessmentKey;
}
