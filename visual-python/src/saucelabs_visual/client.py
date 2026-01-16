from dataclasses import asdict
from datetime import datetime, timedelta
from os import environ
from time import sleep
from typing import List, Union

from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport
from requests.auth import HTTPBasicAuth
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.remote.webdriver import WebDriver as RemoteWebDriver

from saucelabs_visual.regions import Region
from saucelabs_visual.typing import IgnoreRegion, FullPageConfig, DiffingMethod, BuildStatus, \
    DiffingOptions, IgnoreElementRegion, BuildMode, BaselineOverride, DiffingMethodSensitivity, \
    DiffingMethodTolerance

PKG_VERSION = '0.7.0'


class SauceLabsVisual:
    _client: Client = None
    _build_id: Union[str, None] = None
    """
    The UUID of the current build managed by this client. 
    """
    _is_build_external: bool = False
    """
    Whether this build was created externally and passed here. When 'True', we should not perform
    any mutations on the build itself assuming the lifecycle is managed externally.
    """
    _build_url: Union[str, None] = None
    """
    The URL for the current build in the Sauce Labs UI.
    """
    _meta_cache: dict = {}
    """
    A cache holding session metadata for a job so we don't have to re-query for every snapshot for
    the same session ID.
    """
    _region: Region = None

    capture_dom: Union[bool, None] = None
    diffing_method: Union[DiffingMethod, None] = None
    diffing_method_sensitivity: Union[DiffingMethodSensitivity, None] = None
    diffing_method_tolerance: Union[DiffingMethodTolerance, None] = None
    baseline_override: Union[BaselineOverride, None] = None
    hide_scroll_bars: Union[bool, None] = None
    full_page_config: Union[FullPageConfig, None] = None

    def __init__(
            self,
            username: Union[str, None] = environ.get("SAUCE_USERNAME"),
            access_key : Union[str, None] = environ.get("SAUCE_ACCESS_KEY"),
            region: Union[str, None] = environ.get('SAUCE_REGION'),
    ):
        self._client = self._create_client(
            username=username,
            access_key=access_key,
            region=region,
        )

    @property
    def client(self):
        return self._client

    def _create_client(
            self,
            username: Union[str, None] = None,
            access_key : Union[str, None] = None,
            region : Union[str, None] = None,
       ):
        if username is None or access_key is None:
            raise RuntimeError(
                'Sauce Labs credentials not set. Please check that you set correctly your '
                '`SAUCE_USERNAME` and `SAUCE_ACCESS_KEY` environment variables.'
            )

        self._region = Region.from_name(region or 'us-west-1')
        region_url = self._region.graphql_endpoint
        user_agent = 'visual-python/{version}'.format(version=PKG_VERSION)
        transport = RequestsHTTPTransport(url=region_url, auth=HTTPBasicAuth(username, access_key),
                                          headers={
                                              'user-agent': user_agent,
                                          })
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
        """
        Create a Visual build through the Sauce API.
        :param name: A name to identify this build in the UI. Does not have to be unique.
        :param project: An optional identifier to group multiple builds together for easier
            organization in the UI.
        :param branch: An optional identifier to identify which Version Control branch this build
            belongs to. Can be used during a branching workflow for easier filtering / comparison
            in the UI.
        :param default_branch: The branch we should compare against if no baselines are found for
            the current branch. See the 'Branching and Merging Workflow' section in our docs:
            https://docs.saucelabs.com/visual-testing/workflows/ci/
        :param custom_id: An optional globally unique identifier to recall this build later, such
            as the pipeline ID in CI so the status can be checked in a later step.
        :param keep_alive_timeout: An integer, in seconds, for long we should keep the build alive
            before timing out and reporting an error in the UI.
        :return:
        """

        custom_build = self._get_external_build()

        if custom_build is not None:
            self._build_id = custom_build['id']
            self._build_url = custom_build['url']
            self._is_build_external = True
            return custom_build

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
                    mode
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
        self._build_id = build['createBuild']['id']
        self._build_url = build['createBuild']['url']
        return build

    def finish_build(self, build_id: Union[str, None] = None):
        """
        Finish the build associated with this client or, optionally, one supplied with 'build_id'.
        :param build_id: An optional param to allow finishing an external build.
        :return:
        """
        if self._is_build_external:
            return

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
        values = {"id": build_id or self._build_id}
        self._meta_cache.clear()
        return self.client.execute(query, variable_values=values)

    def get_selenium_metadata(self, session_id: str, job_id: str) -> str:
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
        values = {"sessionId": session_id, "jobId": job_id}
        meta = self.client.execute(query, variable_values=values)
        return meta['meta']['blob']

    def _get_meta(self, session_id: str, job_id: str = None) -> str:
        job_id = job_id or session_id
        cache_key = f'{session_id}:{job_id}'.format(session_id=session_id, job_id=job_id)
        meta = self._meta_cache.get(cache_key)

        if meta is None:
            meta = self.get_selenium_metadata(session_id, job_id)
            self._meta_cache[cache_key] = meta

        return meta

    def _get_session_ids(self, driver: RemoteWebDriver) -> tuple[str, str]:
        return [driver.session_id, driver.capabilities.get('jobUuid') or driver.session_id]

    def create_snapshot_from_webdriver(
            self,
            name: str,
            driver: RemoteWebDriver,
            test_name: Union[str, None] = None,
            suite_name: Union[str, None] = None,
            capture_dom: Union[bool, None] = None,
            clip_selector: Union[str, None] = None,
            clip_element: Union[WebElement, None] = None,
            ignore_regions: Union[List[IgnoreRegion], None] = None,
            ignore_elements: Union[List[IgnoreElementRegion], None] = None,
            full_page_config: Union[FullPageConfig, None] = None,
            diffing_method: Union[DiffingMethod, None] = None,
            diffing_options: Union[DiffingOptions, None] = None,
            baseline_override: Union[BaselineOverride, None] = None,
            hide_scroll_bars: Union[bool, None] = None,
            diffing_method_sensitivity: Union[DiffingMethodSensitivity, None] = None,
            diffing_method_tolerance: Union[DiffingMethodTolerance, None] = None,
    ):
        """
        Create a Visual snapshot in Sauce Labs with a running browser on Sauce.
        :param name: A name to identify this snapshot in the UI.
        :param driver: The remote webdriver instance (chrome, firefox, appium, etc) used to control
            your device.
        :param test_name: The name of the current suite to group / identify in the UI.
        :param suite_name: The name of the current test to group / identify in the UI.
        :param capture_dom: Whether we should capture the DOM while taking a screenshot.
        :param clip_selector: A CSS selector that we should clip the screenshot to.
        :param clip_element: A WebElement instance we should clip the screenshot to.
        :param ignore_regions: One or more regions on the page that we should ignore changes in.
        :param ignore_elements: One or more `IgnoreElementRegion`s we should ignore.
        :param full_page_config: Enable or adjust the behavior of Visual full page screenshots.
        :param diffing_method: The diffing method we should use for comparison.
        :param diffing_options: Options to customize the DOM <-> Visual behavior for the BALANCED
            diffing method.
        :param baseline_override: One or more keys we should use as an override when matching
            a baseline.
        :param hide_scroll_bars: Hide all scrollbars in the web app. Default value is `true`.
        :param diffing_method_sensitivity: Adjust the sensitivity of supported diffing engines
            using a preset.
        :param diffing_method_tolerance: Adjust the individual sensitivity settings for supported
            diffing engines.
        :return:
        """
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
                $jobId: String,
                $clipElement: WebdriverElementID,
                $ignoreRegions: [RegionIn!],
                $ignoreElements: [ElementIn!],
                $fullPageConfig: FullPageConfigIn,
                $diffingMethod: DiffingMethod,
                $diffingOptions: DiffingOptionsIn,
                $baselineOverride: BaselineOverrideIn,
                $hideScrollBars: Boolean,
                $diffingMethodSensitivity: DiffingMethodSensitivity,
                $diffingMethodTolerance: DiffingMethodToleranceIn,
            ) {
                createSnapshotFromWebDriver(input: {
                    name: $name,
                    sessionId: $sessionId,
                    sessionMetadata: $meta,
                    buildUuid: $buildId,
                    testName: $testName,
                    suiteName: $suiteName,
                    jobId: $jobId,
                    captureDom: $captureDom,
                    clipElement: $clipElement,
                    ignoreRegions: $ignoreRegions,
                    ignoreElements: $ignoreElements,
                    fullPageConfig: $fullPageConfig,
                    diffingMethod: $diffingMethod,
                    diffingOptions: $diffingOptions,
                    baselineOverride: $baselineOverride,
                    hideScrollBars: $hideScrollBars,
                    diffingMethodSensitivity: $diffingMethodSensitivity,
                    diffingMethodTolerance: $diffingMethodTolerance,
                }){
                    id
                }
            }
            """
        )
        [session_id, job_id] = self._get_session_ids(driver)
        meta = self._get_meta(session_id, job_id)
        full_page_config = full_page_config or self.full_page_config
        baseline_override = baseline_override or self.baseline_override
        diffing_method = diffing_method or self.diffing_method
        diffing_method_sensitivity = diffing_method_sensitivity or self.diffing_method_sensitivity
        diffing_method_tolerance = diffing_method_tolerance or self.diffing_method_tolerance
        values = {
            "name": name,
            "sessionId": session_id,
            "meta": meta,
            "buildId": self._build_id,
            "testName": test_name,
            "suiteName": suite_name,
            "captureDom": capture_dom if capture_dom is not None else self.capture_dom,
            "clipElement": clip_element.id if clip_element is not None else None,
            "jobId": driver.capabilities.get("jobUuid") or driver.session_id,
            "ignoreRegions": [
                asdict(region) for region in ignore_regions
            ] if ignore_regions is not None else None,
            "ignoreElements": [
                element
                for group in ignore_elements
                for element in group.as_dict_array()
            ] if ignore_elements is not None else None,
            "fullPageConfig": asdict(full_page_config) if full_page_config is not None else None,
            "diffingMethod": (diffing_method or DiffingMethod.BALANCED).value,
            "diffingOptions": diffing_options,
            "diffingMethodSensitivity": diffing_method_sensitivity.value
            if diffing_method_sensitivity is not None else None,
            "diffingMethodTolerance": diffing_method_tolerance,
            "baselineOverride": {
                key: value for key, value in asdict(baseline_override).items() if value is not False
            } if baseline_override is not None else None,
            "hideScrollBars": hide_scroll_bars if hide_scroll_bars is not None else self.hide_scroll_bars
        }
        return self.client.execute(query, variable_values=values)

    def _get_external_build(self) -> Union[dict, None]:
        """
        Check if we've been provided environment variables to use an external build instead of one
        handled by the lifecycle in this client. If provided, query for the build and set the client
        up to use it.
        :return:
        """
        env_build_id = environ.get('SAUCE_VISUAL_BUILD_ID')
        env_custom_id = environ.get('SAUCE_VISUAL_CUSTOM_ID')
        build: Union[dict, None] = None

        def get_build_meta(result: dict):
            result_build = result['result']
            if result_build is None:
                return None

            if result_build['mode'] == BuildMode.COMPLETED.value:
                raise RuntimeError(
                    "Sauce Labs Visual: cannot add more screenshots since the build is already "
                    "completed"
                )

            return result_build

        if env_build_id:
            query = gql(
                # language=GraphQL
                """
                query buildById($buildId: UUID!) {
                    result: build(id: $buildId) {
                        id
                        mode
                        url
                    }
                }
                """
            )
            build = get_build_meta(
                self.client.execute(query, variable_values={
                    "buildId": env_build_id,
                })
            )

        if env_custom_id:
            query = gql(
                # language=GraphQL
                """
                query buildById($customId: String!) {
                    result: buildByCustomId(customId: $customId) {
                        id
                        mode
                        url
                    }
                }
                """
            )
            build = get_build_meta(
                self.client.execute(query, variable_values={
                    "customId": env_custom_id,
                })
            )

        return build

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
            "buildId": self._build_id,
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
        return self._build_url

    def get_build_created_link(self) -> str:
        return f'Sauce Labs Visual build created:\t{self.get_build_link()}'

    def get_build_finished_link(self) -> str:
        return f'Sauce Labs Visual build finished:\t{self.get_build_link()}'
