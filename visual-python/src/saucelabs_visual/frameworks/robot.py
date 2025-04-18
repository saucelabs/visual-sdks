from ast import literal_eval
from os import environ
from typing import List, Union, Literal, Tuple

from SeleniumLibrary import SeleniumLibrary
from robot.api import logger
from robot.api.deco import library, keyword
from robot.libraries.BuiltIn import BuiltIn
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.remote.webdriver import WebDriver as RemoteWebDriver

from saucelabs_visual.client import SauceLabsVisual as Client
from saucelabs_visual.typing import IgnoreRegion, FullPageConfig, DiffingMethod, DiffingOptions, \
    IgnoreElementRegion, BaselineOverride, Browser, OperatingSystem, DiffingMethodSensitivity, \
    DiffingMethodTolerance
from saucelabs_visual.utils import ignore_region_from_dict, is_valid_ignore_region, \
    create_table_from_build_status, is_build_errored, is_build_failed


@library(scope='GLOBAL')
class SauceLabsVisual:
    _client: Client = None
    selenium_library_key: Union[str, None] = None

    @property
    def client(self):
        if self._client is None:
            self._client = Client()
        return self._client

    def _get_selenium_library(self) -> SeleniumLibrary:
        all_libraries: dict = BuiltIn().get_library_instance(all=True)

        # SeleniumLibrary may be imported under another name if an alias is provided -- ex:
        #
        # Library           SeleniumLibrary    AS    slib
        #
        # Instead of importing by static name, we'll get all imported libraries and iterate over
        # them to find the instance of SeleniumLibrary and cache that key.
        if self.selenium_library_key is None:
            for key, value in all_libraries.items():
                if type(value) is SeleniumLibrary:
                    self.selenium_library_key = key
                    break

        if self.selenium_library_key is None:
            raise RuntimeError(
                'SeleniumLibrary instance not found in Robot. Is it imported in your project?'
            )

        return BuiltIn().get_library_instance(self.selenium_library_key)

    def _get_driver(self) -> RemoteWebDriver:
        return self._get_selenium_library().driver

    def _parse_full_page_config(self, value: Union[bool, FullPageConfig, dict, str]) -> Union[
        FullPageConfig, None
    ]:
        """
        Parses the value from the 'Visual Snapshot' keyword to allow optional values and defaults
        that make sense. Otherwise, they would have to supply all properties to full_page_config
        which could get verbose.
        :param value:
        :return:
        """

        # short-circuit early if we've been passed a full page object
        if type(value) is FullPageConfig:
            return value

        literal = literal_eval(value) if type(value) is str else value
        literal_type = type(literal)
        parsed_value = None

        if literal_type is dict:
            parsed_value = literal
        elif literal_type is bool:
            parsed_value = {} if literal is True else None

        return FullPageConfig(
            delayAfterScrollMs=parsed_value.get('delay_after_scroll_ms'),
            hideAfterFirstScroll=parsed_value.get('hide_after_first_scroll'),
            disableCSSAnimation=parsed_value.get('disable_css_animation'),
            hideScrollBars=parsed_value.get('hide_scroll_bars'),
            scrollLimit=parsed_value.get('scroll_limit'),
        ) if parsed_value is not None else None

    def _parse_ignore_regions(
            self,
            ignore_regions: List[Union[IgnoreRegion, str, WebElement, IgnoreElementRegion, dict]],
    ) -> Tuple[List[IgnoreRegion], List[IgnoreElementRegion]]:
        """
        Parse ignore regions passed through Robot to allow selectors, web elements, and dicts --
        validating those regions.
        :param ignore_regions:
        :return:
        """
        selenium_library = self._get_selenium_library()
        parsed_ignore_regions: List[Union[IgnoreRegion, None]] = []
        element_regions: List[IgnoreElementRegion] = []

        def parse_element(
                element_to_parse: Union[
                    IgnoreRegion, str, WebElement, List[WebElement], IgnoreElementRegion, dict
                ]
        ):
            literal_type = type(element_to_parse)
            if isinstance(element_to_parse, List):
                for element in element_to_parse:
                    parse_element(element)
            elif literal_type is IgnoreRegion:
                parsed_ignore_regions.append(element_to_parse)
            elif literal_type is IgnoreElementRegion:
                element_regions.append(element_to_parse)
            elif literal_type is dict:
                parsed_ignore_regions.append(
                    ignore_region_from_dict(element_to_parse)
                )
            elif literal_type is str:
                element_regions.append(
                    IgnoreElementRegion(
                        element=selenium_library.get_webelements(element_to_parse),
                    )
                )
            elif literal_type is WebElement:
                element_regions.append(IgnoreElementRegion(
                    element=element_to_parse,
                ))

        parse_element(ignore_regions)

        return (
            [
                region for region in parsed_ignore_regions if self._is_valid_ignore_region(region)
            ],
            element_regions,
        )

    def _is_valid_ignore_region(self, region: IgnoreRegion):
        if is_valid_ignore_region(region):
            return True
        else:
            logger.warn(
                f'Invalid ignore region "{region}" supplied for visual snapshot. Skipping.'
            )
            return False

    @keyword(name="Create Visual Build")
    def create_visual_build(
            # Params 'duplicated' here, so we get type casting and named parameters provided by
            # Robot Framework for free.
            self,
            name: Union[str, None] = environ.get('SAUCE_VISUAL_BUILD_NAME'),
            project: Union[str, None] = environ.get('SAUCE_VISUAL_PROJECT'),
            branch: Union[str, None] = environ.get('SAUCE_VISUAL_BRANCH'),
            default_branch: Union[str, None] = environ.get('SAUCE_VISUAL_DEFAULT_BRANCH'),
            custom_id: Union[str, None] = environ.get('SAUCE_VISUAL_CUSTOM_ID'),
            keep_alive_timeout: int = None,
    ):
        self.client.create_build(
            name=name,
            project=project,
            branch=branch,
            default_branch=default_branch,
            custom_id=custom_id,
            keep_alive_timeout=keep_alive_timeout,
        )
        logger.info(self.client.get_build_created_link(), also_console=True)

    @keyword(name="Finish Visual Build")
    def finish_visual_build(self):
        logger.info(self.client.get_build_finished_link(), also_console=True)
        self.client.finish_build()

    @keyword(name="Visual Ignore Element")
    def visual_ignore_element(
            self,
            element: Union[WebElement, List[WebElement]],
            name: Union[str, None] = None,
            diffing_options: Union[DiffingOptions, None] = None,
            enable_only: Union[List[
                Literal['content', 'dimensions', 'position', 'structure', 'style', 'visual']
            ], None] = None,
            disable_only: Union[List[
                Literal['content', 'dimensions', 'position', 'structure', 'style', 'visual']
            ], None] = None,
    ):
        return IgnoreElementRegion(
            element=element,
            name=name,
            diffingOptions=diffing_options,
            enable_only=enable_only,
            disable_only=disable_only,
        )

    @keyword(name="Visual Ignore Region")
    def visual_ignore_region(
            self,
            x: int,
            y: int,
            width: int,
            height: int,
            name: Union[str, None] = None,
            diffing_options: Union[DiffingOptions, None] = None,
            enable_only: Union[List[
                Literal['content', 'dimensions', 'position', 'structure', 'style', 'visual']
            ], None] = None,
            disable_only: Union[List[
                Literal['content', 'dimensions', 'position', 'structure', 'style', 'visual']
            ], None] = None,
    ):
        return IgnoreRegion(
            x,
            y,
            width,
            height,
            name=name,
            diffingOptions=diffing_options,
            enable_only=enable_only,
            disable_only=disable_only,
        )

    @keyword(name="Visual Set Global BaselineOverride")
    def visual_set_baseline_override(self, baseline_override: Union[BaselineOverride, None]):
        self.client.baseline_override = baseline_override

    @keyword(name="Visual Set Global CaptureDom")
    def visual_set_capture_dom(self, capture_dom: Union[bool, None]):
        self.client.capture_dom = capture_dom

    @keyword(name="Visual Set Global DiffingMethod")
    def visual_set_diffing_method(self, diffing_method: Union[DiffingMethod, None]):
        self.client.diffing_method = diffing_method

    @keyword(name="Visual Set Global HideScrollBars")
    def visual_set_hide_scroll_bars(self, hide_scroll_bars: Union[bool, None]):
        self.client.hide_scroll_bars = hide_scroll_bars

    @keyword(name="Visual Set Global FullPageConfig")
    def visual_set_full_page_config(self, full_page_config: Union[FullPageConfig, None]):
        self.client.full_page_config = full_page_config

    @keyword(name="Visual FullPageConfig")
    def visual_full_page_config(
            self,
            delay_after_scroll_ms: Union[int, None] = None,
            hide_after_first_scroll: Union[List[str], None] = None,
            disable_css_animation: Union[bool, None] = None,
            hide_scroll_bars: Union[bool, None] = None,
            scroll_limit: Union[int, None] = None,
    ):
        return FullPageConfig(
            delayAfterScrollMs=delay_after_scroll_ms,
            hideAfterFirstScroll=hide_after_first_scroll,
            disableCSSAnimation=disable_css_animation,
            hideScrollBars=hide_scroll_bars,
            scrollLimit=scroll_limit,
        )

    @keyword(name="Visual BaselineOverride")
    def visual_baseline_override(
            self,
            browser: Union[Browser, None] = None,
            browser_version: Union[str, None] = None,
            device: Union[str, None] = None,
            name: Union[str, None] = None,
            operating_system: Union[OperatingSystem, None] = None,
            operating_system_version: Union[str, None] = None,
            suite_name: Union[str, None] = None,
            test_name: Union[str, None] = None,
    ):
        return BaselineOverride(
            browser=browser,
            browserVersion=browser_version,
            device=device,
            name=name,
            operatingSystem=operating_system,
            operatingSystemVersion=operating_system_version,
            suiteName=suite_name,
            testName=test_name,
        )

    @keyword(name="Visual Snapshot")
    def visual_snapshot(
            # Params 'duplicated' here, so we get type casting and named parameters provided by
            # Robot Framework for free.
            self,
            name: str,
            capture_dom: Union[bool, None] = None,
            clip_selector: Union[str, None] = None,
            clip_element: Union[WebElement, None] = None,
            ignore_regions: List[Union[
                List[WebElement], IgnoreRegion, str, WebElement, IgnoreElementRegion, dict
            ]] = None,
            full_page_config: Union[FullPageConfig, dict, bool, str, None] = None,
            diffing_method: Union[DiffingMethod, None] = None,
            diffing_options: Union[DiffingOptions, None] = None,
            baseline_override: Union[BaselineOverride, None] = None,
            hide_scroll_bars: Union[bool, None] = None,
            diffing_method_sensitivity: Union[DiffingMethodSensitivity, None] = None,
            diffing_method_tolerance: Union[DiffingMethodTolerance, None] = None,
    ):
        # Robot fails when attempting to parse a TypedDict out of a Union -- and converters are not
        # triggered. So, allow the default value as a string then parse it ourselves to allow us
        # to set proper default / optional values.
        parsed_fpc = self._parse_full_page_config(full_page_config) if (
                full_page_config is not None) else None

        # Convert selectors into WebElements & ignore regions
        parsed_ignore_regions, parsed_ignore_elements = self._parse_ignore_regions(
            ignore_regions) if ignore_regions is not None else [None, None]

        self.client.create_snapshot_from_webdriver(
            name=name,
            driver=self._get_driver(),
            test_name=BuiltIn().get_variable_value('\${TEST NAME}'),
            suite_name=BuiltIn().get_variable_value('\${SUITE NAME}'),
            capture_dom=capture_dom,
            clip_selector=clip_selector,
            clip_element=clip_element,
            ignore_regions=parsed_ignore_regions,
            ignore_elements=parsed_ignore_elements,
            full_page_config=parsed_fpc,
            diffing_method=diffing_method,
            diffing_options=diffing_options,
            baseline_override=baseline_override,
            hide_scroll_bars=hide_scroll_bars,
            diffing_method_sensitivity=diffing_method_sensitivity,
            diffing_method_tolerance=diffing_method_tolerance,
        )

    @keyword(name="Visual Build Status")
    def visual_build_status(
            self,
            wait: bool = True,
            timeout: int = 60,
            fail_on_error: bool = True,
            fail_on_changes: bool = False,
    ):
        result = self.client.get_build_status(
            wait=wait,
            timeout=timeout,
        )

        fail_message: Union[None, str] = None

        if fail_on_error and is_build_errored(result):
            fail_message = ('Failed to finish Visual build in time or one or more errors was '
                            'detected in the build.')

        if fail_on_changes and is_build_failed(result):
            fail_message = 'Sauce Visual detected one or more visual changes. Please review.'

        table = create_table_from_build_status(result)
        logger.info(table, html=True, also_console=True)

        # If an error message is present (a user has opted in) then fail the build by using Robot's
        # error builtin, so we get an erroneous response in the CLI and Suite Teardown / log.
        if fail_message:
            BuiltIn().fail(fail_message)
