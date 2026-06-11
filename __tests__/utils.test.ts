import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import * as core from '@actions/core'

import {getAbsoluteFilePaths} from '../src/utils/file-utils'
import {transformTrxToJson} from '../src/parsers/trx-parser'

describe('Test GetAbsolutePath returns correct values', () => {
  it('getAbsoluteFilePaths()', async () => {
    const filesNames = ['abc.trx', 'xyz.trx']
    const dirName = path.resolve('test-data')
    const expectedPaths = [
      path.resolve('test-data', 'abc.trx'),
      path.resolve('test-data', 'xyz.trx')
    ]

    const actualPaths = getAbsoluteFilePaths(filesNames, dirName)
    expect(actualPaths).toEqual(expectedPaths)
  })
})
describe('when loading xml from a trx file', () => {
  test('LoadXml Should have an outcome of Completed()', async () => {
    const data = await transformTrxToJson(
      './test-data/passing-tests/logger.trx'
    )
    expect(data.TrxData.TestRun.ResultSummary._outcome).toEqual('Completed')
    expect(data.TrxData.TestRun.ResultSummary.Counters._total).toEqual(21)
    expect(data.TrxData.TestRun.ResultSummary.Counters._passed).toEqual(10)
    expect(data.TrxData.TestRun.ResultSummary.Counters._passed).toEqual(
      data.TrxData.TestRun.ResultSummary.Counters._executed
    )
    expect(data.TrxData.TestRun.ResultSummary.Counters._failed).toEqual(0)
  })

  test('LoadXml Should have an outcome of Failed', async () => {
    const data = await transformTrxToJson(
      './test-data/failing-tests/dummy-tests.trx'
    )
    expect(data.TrxData.TestRun.ResultSummary._outcome).toEqual('Failed')
    expect(data.TrxData.TestRun.ResultSummary.Counters._total).toEqual(4)
    expect(data.TrxData.TestRun.ResultSummary.Counters._passed).toEqual(3)
    expect(data.TrxData.TestRun.ResultSummary.Counters._failed).toEqual(1)
  })

  test('Test Data with a single test', async () => {
    const data = await transformTrxToJson(
      './test-data/passing-tests/single-test.trx'
    )
    expect(data.TrxData.TestRun.ResultSummary._outcome).toEqual('Completed')
    expect(data.TrxData.TestRun.ResultSummary.Counters._total).toEqual(1)
    expect(data.TrxData.TestRun.ResultSummary.Counters._passed).toEqual(1)
    expect(data.TrxData.TestRun.ResultSummary.Counters._failed).toEqual(0)
  })

  test('does not warn for escaped XML entities or ordinary text', async () => {
    const warning = jest.spyOn(core, 'warning').mockImplementation()
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trx-parser-'))
    const trxPath = path.join(tempDir, 'escaped-entities.trx')
    fs.writeFileSync(
      trxPath,
      `<?xml version="1.0" encoding="utf-8"?>
<TestRun id="18374034-5a06-43df-a5b0-514438348099" name="@runner 2021-04-14 12:21:07" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010">
  <Times creation="2021-04-14T12:21:07.4539825+00:00" queuing="2021-04-14T12:21:07.4539826+00:00" start="2021-04-14T12:21:04.9146955+00:00" finish="2021-04-14T12:21:07.4638160+00:00" />
  <TestSettings name="default" id="93c63022-578d-4635-a224-30004e44d2a8" />
  <TestLists>
    <TestList name="Results Not in a List" id="8c84fa94-04c1-424b-9868-57a2d4851a1d" />
  </TestLists>
  <ResultSummary outcome="Completed">
    <Counters total="0" executed="0" passed="0" failed="0" error="0" timeout="0" aborted="0" inconclusive="0" passedButRunAborted="0" notRunnable="0" notExecuted="0" disconnected="0" warning="0" completed="0" inProgress="0" pending="0" />
    <Output>
      <StdOut>test discoverer &amp; executors are registered; List&lt;T&gt;; a=1&amp;b=2; line&#xD;&#xA;break<![CDATA[; inert <!DOCTYPE html> and <!ENTITY entity "value"> text]]></StdOut>
    </Output>
    <!-- inert <!DOCTYPE html> and <!ENTITY entity "value"> text -->
    <RunInfos>
      <RunInfo computerName="PUBLIC &amp; SYSTEM runner" outcome="Warning" timestamp="2021-04-14T12:21:07.3568548+00:00">
        <Text>No test is available. PUBLIC and SYSTEM are ordinary words here.</Text>
      </RunInfo>
    </RunInfos>
  </ResultSummary>
</TestRun>`
    )

    try {
      const data = await transformTrxToJson(trxPath)

      expect(data.TrxData.TestRun.ResultSummary._outcome).toEqual('Completed')
      expect(warning).not.toHaveBeenCalledWith(
        'XML contains potentially dangerous constructs (entities, DTD references, or external references)'
      )
    } finally {
      warning.mockRestore()
      fs.rmSync(tempDir, {recursive: true, force: true})
    }
  })

  test('warns for raw XML DTD and entity declarations', async () => {
    const warning = jest.spyOn(core, 'warning').mockImplementation()
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trx-parser-'))
    const trxPath = path.join(tempDir, 'dangerous-construct.trx')
    fs.writeFileSync(
      trxPath,
      `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE TestRun [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<TestRun id="18374034-5a06-43df-a5b0-514438348099" name="@runner 2021-04-14 12:21:07" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010">
  <Times creation="2021-04-14T12:21:07.4539825+00:00" queuing="2021-04-14T12:21:07.4539826+00:00" start="2021-04-14T12:21:04.9146955+00:00" finish="2021-04-14T12:21:07.4638160+00:00" />
  <ResultSummary outcome="Completed">
    <Counters total="0" executed="0" passed="0" failed="0" error="0" timeout="0" aborted="0" inconclusive="0" passedButRunAborted="0" notRunnable="0" notExecuted="0" disconnected="0" warning="0" completed="0" inProgress="0" pending="0" />
  </ResultSummary>
</TestRun>`
    )

    try {
      await transformTrxToJson(trxPath).catch(() => undefined)

      expect(warning).toHaveBeenCalledWith(
        'XML contains potentially dangerous constructs (entities, DTD references, or external references)'
      )
    } finally {
      warning.mockRestore()
      fs.rmSync(tempDir, {recursive: true, force: true})
    }
  })
})
