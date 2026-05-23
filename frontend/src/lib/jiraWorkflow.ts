export const QA_HUB_GHERKIN_LABELS = ['qa', 'gherkin'];

export function buildDefaultSyncJql(projectKey = 'SCRUM') {
  return `project = ${projectKey} AND labels in (${QA_HUB_GHERKIN_LABELS.join(', ')}) ORDER BY updated DESC`;
}
