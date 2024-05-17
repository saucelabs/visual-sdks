import { DiffStatus, VisualConfig, getApi } from '@saucelabs/visual';
import SauceVisualService, { uploadedDiffIds } from './SauceVisualService';
import { Testrunner } from '@wdio/types/build/Options';

jest.mock('@wdio/logger', () => () => ({ default: jest.fn() }));
jest.mock('chalk', () => ({ default: jest.fn() }));

const config: VisualConfig = { region: 'us', user: 'u', key: 'k' };
const api = getApi(config);
const diffsForTestResult = jest.spyOn(api, 'diffsForTestResult');

test('Should return no unapproved diffs when there are no diffs at all', async () => {
  diffsForTestResult.mockReset();
  diffsForTestResult.mockImplementation(() => {
    return Promise.resolve({ nodes: [] });
  });
  const service = new SauceVisualService({}, {}, config as Testrunner);

  const result = await service.sauceVisualResults(api, '')();
  expect(result.UNAPPROVED).toEqual(0);
});

test('Should return no unapproved diffs when there are only equal diffs', async () => {
  diffsForTestResult.mockReset();
  diffsForTestResult.mockImplementationOnce(() => {
    return Promise.resolve({
      nodes: [
        { id: '1', status: DiffStatus.Approved },
        { id: '2', status: DiffStatus.Approved },
      ],
    });
  });
  const service = new SauceVisualService({}, {}, config as Testrunner);
  uploadedDiffIds.push('1', '2');
  const result = await service.sauceVisualResults(api, '')();
  expect(result.APPROVED).toEqual(2);
});

test('Should return unapproved diffs when there are unapproved diffs', async () => {
  diffsForTestResult.mockReset();
  diffsForTestResult
    .mockImplementationOnce(() => {
      return Promise.resolve({
        nodes: [{ id: '1', status: DiffStatus.Queued }],
      });
    })
    .mockImplementationOnce(() => {
      return Promise.resolve({
        nodes: [{ id: '1', status: DiffStatus.Unapproved }],
      });
    });
  const service = new SauceVisualService({}, {}, config as Testrunner);
  uploadedDiffIds.push('1', '2');
  const result = await service.sauceVisualResults(api, '')();
  expect(result.UNAPPROVED).toEqual(1);
});
