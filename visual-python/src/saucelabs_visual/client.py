from os import environ
from typing import List, Union

from gql import Client, gql
from gql.transport.aiohttp import AIOHTTPTransport, BasicAuth

from saucelabs_visual.regions import Region
from saucelabs_visual.typing import IgnoreRegion, FullPageConfig


class SauceLabsVisual:
    client: Client = None
    build_id: Union[str, None] = None
    meta_cache: dict = {}

    def __init__(self):
        self._create_client()

    def _create_client(self):
        username = environ.get("SAUCE_USERNAME")
        access_key = environ.get("SAUCE_ACCESS_KEY")

        if username is None or access_key is None:
            raise Exception(
                'Sauce Labs credentials not set. Please check that you set correctly your '
                '`SAUCE_USERNAME` and `SAUCE_ACCESS_KEY` environment variables.'
            )

        region_url = Region.from_name(environ.get("SAUCE_REGION") or 'us-west-1').graphql_endpoint
        transport = AIOHTTPTransport(url=region_url, auth=BasicAuth(username, access_key))
        self.client = Client(transport=transport, execute_timeout=90)

    def get_client(self) -> Client:
        return self.client

    def create_build(
            self,
            name: str = environ.get('SAUCE_VISUAL_BUILD_NAME') or None,
            project: str = environ.get('SAUCE_VISUAL_PROJECT') or None,
            branch: str = environ.get('SAUCE_VISUAL_BRANCH') or None,
            default_branch: str = environ.get('SAUCE_VISUAL_DEFAULT_BRANCH') or None,
            custom_id: str = environ.get('SAUCE_VISUAL_CUSTOM_ID') or None,
            keep_alive_timeout: int = None
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
        self.build_id = None
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
            test_name: str = None,
            suite_name: str = None,
            capture_dom: bool = False,
            clip_selector: str = None,
            ignore_regions: List[IgnoreRegion] = None,
            full_page_config: FullPageConfig = None,
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
        }
        return self.client.execute(query, variable_values=values)
