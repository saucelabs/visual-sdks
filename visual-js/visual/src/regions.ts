import { SauceRegion } from './api';

export class VisualApiRegion {
  name: SauceRegion;
  aliases: string[];
  graphqlEndpoint: string;
  jobUrlTemplate: string;

  constructor(options: {
    name: SauceRegion;
    aliases: string[];
    graphqlEndpoint: string;
    jobUrlTemplate: string;
  }) {
    this.name = options.name;
    this.aliases = options.aliases;
    this.graphqlEndpoint = options.graphqlEndpoint;
    this.jobUrlTemplate = options.jobUrlTemplate;
  }

  jobUrl(jobId: string): string {
    return this.jobUrlTemplate.replace('JOB_ID', jobId);
  }

  static fromName(name: string) {
    const r = regions.find((r) => r.name === name || r.aliases.includes(name));
    if (!r) {
      throw new Error(`${name} is not recognised as a Sauce Labs region.`);
    }
    return r;
  }
}

export const regions: VisualApiRegion[] = [
  new VisualApiRegion({
    name: 'staging',
    aliases: ['us-west-4-jeh6'],
    graphqlEndpoint: 'https://api.staging.saucelabs.net/v1/visual/graphql',
    jobUrlTemplate: 'https://app.staging.saucelabs.net/tests/JOB_ID',
  }),
  new VisualApiRegion({
    name: 'us-east-4',
    aliases: ['us-east-4-cm5i'],
    graphqlEndpoint: 'https://api.us-east-4.saucelabs.com/v1/visual/graphql',
    jobUrlTemplate: 'https://app.us-east-4.saucelabs.com/tests/JOB_ID',
  }),
  new VisualApiRegion({
    name: 'eu-central-1',
    aliases: ['eu', 'eu-west-3-lnbf'],
    graphqlEndpoint: 'https://api.eu-central-1.saucelabs.com/v1/visual/graphql',
    jobUrlTemplate: 'https://app.eu-central-1.saucelabs.com/tests/JOB_ID',
  }),
  new VisualApiRegion({
    name: 'us-west-1',
    aliases: ['us', 'us-west-4-i3er'],
    graphqlEndpoint: 'https://api.us-west-1.saucelabs.com/v1/visual/graphql',
    jobUrlTemplate: 'https://app.saucelabs.com/tests/JOB_ID',
  }),
];

export const resolveRegionFromOndemandHostname = (
  hostname: string,
): string | undefined => {
  const match = hostname.match(
    /^ondemand\.(?:([a-z0-9-]+)\.)?saucelabs\.(?:com|net)$/,
  );
  if (!match) {
    return undefined;
  }
  if (!match[1]) {
    return 'us-west-1';
  }
  return match[1];
};
