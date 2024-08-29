import { program, Option } from 'commander';
import { VisualApiRegion } from 'src/common/regions';

const regionParser = (
  input: string,
  _previous: VisualApiRegion,
): VisualApiRegion => {
  if (!input) {
    return VisualApiRegion.fromName('us-west-1');
  }
  try {
    return VisualApiRegion.fromName(input);
  } catch (e: unknown) {
    program.error(String(e));
  }
};

export const regionOption = new Option(
  '-r, --region <region>',
  'The Sauce Labs region. Options: us-west-1, eu-central-1 (Default: "us-west-1)"',
)
  .argParser(regionParser)
  .default(VisualApiRegion.fromName('us-west-1'));
