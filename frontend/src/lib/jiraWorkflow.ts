export const QA_HUB_GHERKIN_LABELS = ['qa', 'gherkin'];

export function buildDefaultSyncJql(projectKey = 'SCRUM') {
  return `project = ${projectKey} ORDER BY updated DESC`;
}
