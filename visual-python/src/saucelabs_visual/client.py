from datetime import datetime, timedelta
from os import environ
from time import sleep
from typing import List, Union

from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport
from requests.auth import HTTPBasicAuth

from saucelabs_visual.regions import Region
from saucelabs_visual.typing import IgnoreRegion, FullPageConfig, DiffingMethod, BuildStatus


class SauceLabsVisual:
    _client: Client = None
    build_id: Union[str, None] = None
    build_url: Union[str, None] = None
    meta_cache: dict = {}
    region: Region = None

    @property
    def client(self):
        if self._client is None:
            self._client = self._create_client()
        return self._client

    def _create_client(self):
        username = environ.get("SAUCE_USERNAME")
        access_key = environ.get("SAUCE_ACCESS_KEY")

        if username is None or access_key is None:
            raise RuntimeError(
                'Sauce Labs credentials not set. Please check that you set correctly your '
                '`SAUCE_USERNAME` and `SAUCE_ACCESS_KEY` environment variables.'
            )

        self.region = Region.from_name(environ.get("SAUCE_REGION") or 'us-west-1')
        region_url = self.region.graphql_endpoint
        transport = RequestsHTTPTransport(url=region_url, auth=HTTPBasicAuth(username, access_key))
        return Client(transport=transport, execute_timeout=90)

    def create_build(
            self,
            name: Union[str, None] = environ.get('SAUCE_VISUAL_BUILD_NAME'),
            project: Union[str, None] = environ.get('SAUCE_VISUAL_PROJECT'),
            branch: Union[str, None] = environ.get('SAUCE_VISUAL_BRANCH'),
            default_branch: Union[str, None] = environ.get('SAUCE_VISUAL_DEFAULT_BRANCH'),
            custom_id: Union[str, None] = environ.get('SAUCE_VISUAL_CUSTOM_ID'),
            keep_alive_timeout: Union[int, None] = None
    ):
        query = gql(
            # language=GraphQL
            """
            mutation createBuild(
                $name: String!,
                $project: String,
                $branch: String,
                $customId: String,
                $defaultBranch: String,
                $keepAliveTimeout: Int,
            ) {
                createBuild(input: {
                    name: $name,
                    project: $project,
                    branch: $branch,
                    customId: $customId,
                    defaultBranch: $defaultBranch,
                    keepAliveTimeout: $keepAliveTimeout,
                }){
                    id
                    url
                }
            }
            """
        )
        values = {
            "name": name,
            "project": project,
            "branch": branch,
            "customId": custom_id,
            "defaultBranch": default_branch,
            "keepAliveTimeout": keep_alive_timeout,
        }
        build = self.client.execute(query, variable_values=values)
        self.build_id = build['createBuild']['id']
        self.build_url = build['createBuild']['url']
        return build

    def finish_build(self):
        query = gql(
            # language=GraphQL
            """
            mutation finishBuild($id: UUID!) {
                finishBuild(input: {uuid: $id}){
                    id
                    url
                    status
                }
            }
            """
        )
        values = {"id": self.build_id}
        self.meta_cache.clear()
        return self.client.execute(query, variable_values=values)

    def get_selenium_metadata(self, session_id: str) -> str:
        query = gql(
            # language=GraphQL
            """
            query webdriverSessionInfo(
                $jobId: ID!,
                $sessionId: ID!
            ) {
                meta: webdriverSessionInfo(input: {
                    sessionId: $sessionId,
                    jobId: $jobId,
                }){
                    blob
                    operatingSystem
                    operatingSystemVersion
                    browser
                    browserVersion
                    deviceName
                }
            }
            """
        )
        values = {"sessionId": session_id, "jobId": session_id}
        meta = self.client.execute(query, variable_values=values)
        return meta['meta']['blob']

    def _get_meta(self, session_id: str) -> str:
        meta = self.meta_cache.get(session_id)

        if meta is None:
            meta = self.get_selenium_metadata(session_id)
            self.meta_cache[session_id] = meta

        return meta

    def create_snapshot_from_webdriver(
            self,
            name: str,
            session_id: str,
            test_name: Union[str, None] = None,
            suite_name: Union[str, None] = None,
            capture_dom: bool = False,
            clip_selector: Union[str, None] = None,
            ignore_regions: Union[List[IgnoreRegion], None] = None,
            full_page_config: Union[FullPageConfig, None] = None,
            diffing_method: DiffingMethod = DiffingMethod.SIMPLE,
    ):
        query = gql(
            # language=GraphQL
            """
            mutation createSnapshot(
                $name: String!,
                $sessionId: ID!,
                $meta: WebdriverSessionBlob!,
                $buildId: UUID!,
                $testName: String,
                $suiteName: String,
                $captureDom: Boolean,
                $clipSelector: String,
                $ignoreRegions: [RegionIn!],
                $fullPageConfig: FullPageConfigIn,
                $diffingMethod: DiffingMethod,
            ) {
                createSnapshotFromWebDriver(input: {
                    name: $name,
                    sessionId: $sessionId,
                    sessionMetadata: $meta,
                    buildUuid: $buildId,
                    testName: $testName,
                    suiteName: $suiteName,
                    captureDom: $captureDom,
                    clipSelector: $clipSelector,
                    ignoreRegions: $ignoreRegions,
                    fullPageConfig: $fullPageConfig,
                    diffingMethod: $diffingMethod,
                }){
                    id
                }
            }
            """
        )
        meta = self._get_meta(session_id)
        values = {
            "name": name,
            "sessionId": session_id,
            "meta": meta,
            "buildId": self.build_id,
            "testName": test_name,
            "suiteName": suite_name,
            "captureDom": capture_dom,
            "clipSelector": clip_selector,
            "ignoreRegions": ignore_regions,
            "fullPageConfig": {
                "delayAfterScrollMs": full_page_config.get('delay_after_scroll_ms'),
                "hideAfterFirstScroll": full_page_config.get('hide_after_first_scroll'),
            } if full_page_config is not None else None,
            "diffingMethod": (diffing_method or DiffingMethod.SIMPLE).value,
        }
        return self.client.execute(query, variable_values=values)

    def get_build_status(
            self,
            wait: bool = True,
            timeout: int = 60,
    ):
        query = gql(
            # language=GraphQL
            """
            query buildStatus($buildId: UUID!) {
                result: build(id: $buildId) {
                    id
                    name
                    url
                    mode
                    status
                    unapprovedCount: diffCountExtended(input: { status: UNAPPROVED })
                    approvedCount: diffCountExtended(input: { status: APPROVED })
                    rejectedCount: diffCountExtended(input: { status: REJECTED })
                    equalCount: diffCountExtended(input: { status: EQUAL })
                    erroredCount: diffCountExtended(input: { status: ERRORED })
                    queuedCount: diffCountExtended(input: { status: QUEUED })
                }
            }
            """
        )
        values = {
            "buildId": self.build_id,
        }

        if not wait:
            return self.client.execute(query, variable_values=values)

        cutoff_time = datetime.now() + timedelta(seconds=timeout)
        build = None
        result = None

        while build is None and datetime.now() < cutoff_time:
            result = self.client.execute(query, variable_values=values)

            if result['result'] is None:
                raise ValueError(
                    'Sauce Visual build has been deleted or you do not have access to view it.'
                )

            if result['result']['status'] != BuildStatus.RUNNING.value:
                build = result
            else:
                sleep(min(10, timeout))

        # Return the successful build if available, else, the last run
        return build if build is not None else result

    def get_build_link(self) -> str:
        """
        Get the dashboard build link for viewing the current build on Sauce Labs.
        :return:
        """
        return self.build_url

    def get_build_created_link(self) -> str:
        return f'Sauce Labs Visual build created:\t{self.get_build_link()}'

    def get_build_finished_link(self) -> str:
        return f'Sauce Labs Visual build finished:\t{self.get_build_link()}'
