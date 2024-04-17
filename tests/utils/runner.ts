import DefaultJestRunner, { Config, TestRunnerContext } from 'jest-runner';

class SerialJestRunner extends DefaultJestRunner {
  declare isSerial?: boolean;

  constructor(_globalConfig: Config.GlobalConfig, _context: TestRunnerContext) {
    super(_globalConfig, _context);
    this.isSerial = true;
  }
}

module.exports = SerialJestRunner;
