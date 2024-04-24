from ast import literal_eval
from os import environ
from typing import List, Union

from SeleniumLibrary import SeleniumLibrary
from robot.api import logger
from robot.api.deco import library, keyword
from robot.libraries.BuiltIn import BuiltIn
from selenium.webdriver.remote.webelement import WebElement

from saucelabs_visual.client import SauceLabsVisual as Client
from saucelabs_visual.typing import IgnoreRegion, FullPageConfig, DiffingMethod
from saucelabs_visual.utils import ignore_region_from_dict, is_valid_ignore_region, \
    create_table_from_build_status, is_build_errored, is_build_failed


@library(scope='GLOBAL')
class SauceLabsVisual:
    client: Client = None

    def __init__(self):
        self.client = Client()

    def _get_selenium_library(self) -> SeleniumLibrary:
        return BuiltIn().get_library_instance('SeleniumLibrary')

    def _get_selenium_id(self) -> str:
        return self._get_selenium_library().get_session_id()

    def _parse_full_page_config(self, value: str) -> Union[FullPageConfig, None]:
        """
        Parses the value from the 'Visual Snapshot' keyword to allow optional values and defaults
        that make sense. Otherwise, they would have to supply all properties to full_page_config
        which could get verbose.
        :param value:
        :return:
        """
        literal = literal_eval(value)
        literal_type = type(literal)
        parsed_value = None

        if literal_type is dict:
            parsed_value = literal
        elif literal_type is bool:
            parsed_value = {} if literal is True else None

        return FullPageConfig(
            delay_after_scroll_ms=parsed_value.get('delay_after_scroll_ms'),
            hide_after_first_scroll=parsed_value.get('hide_after_first_scroll'),
        ) if parsed_value is not None else None

    def _parse_ignore_regions(
            self,
            ignore_regions: List[Union[IgnoreRegion, str, WebElement]],
    ) -> List[IgnoreRegion]:
        """
        Parse ignore regions passed through Robot to allow selectors, web elements, and dicts --
        validating those regions.
        :param ignore_regions:
        :return:
        """
        selenium_library = self._get_selenium_library()
        parsed_ignore_regions: List[Union[IgnoreRegion, None]] = []
        elements_to_query: List[WebElement] = []

        for ignore_region in ignore_regions:
            literal_type = type(ignore_region)
            if literal_type is IgnoreRegion:
                parsed_ignore_regions.append(ignore_region)
            elif literal_type is dict:
                parsed_ignore_regions.append(
                    ignore_region_from_dict(ignore_region)
                )
            elif literal_type is str:
                elements_to_query.extend(
                    selenium_library.get_webelements(ignore_region)
                )
            elif literal_type is WebElement:
                elements_to_query.append(ignore_region)

        for element in elements_to_query:
            rect = element.rect
            region = IgnoreRegion(
                width=rect.get('width'),
                height=rect.get('height'),
                x=rect.get('x'),
                y=rect.get('y'),
            )
            parsed_ignore_regions.append(region)

        return [
            region for region in parsed_ignore_regions if self._is_valid_ignore_region(region)
        ]

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
            **kwargs,
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

    @keyword(name="Visual Snapshot")
    def visual_snapshot(
            # Params 'duplicated' here, so we get type casting and named parameters provided by
            # Robot Framework for free.
            self,
            name: str,
            capture_dom: bool = False,
            clip_selector: Union[str, None] = None,
            ignore_regions: List[Union[IgnoreRegion, str, WebElement]] = None,
            full_page_config: Union[str, None] = None,
            diffing_method: DiffingMethod = DiffingMethod.SIMPLE,
    ):
        session_id = self._get_selenium_id()

        # Robot fails when attempting to parse a TypedDict out of a Union -- and converters are not
        # triggered. So, allow the default value as a string then parse it ourselves to allow us
        # to set proper default / optional values.
        parsed_fpc = self._parse_full_page_config(full_page_config) if (
                type(full_page_config) is str) else None

        # Convert selectors into WebElements & ignore regions
        parsed_ignore_regions = self._parse_ignore_regions(
            ignore_regions) if ignore_regions is not None else None

        self.client.create_snapshot_from_webdriver(
            name=name,
            session_id=session_id,
            test_name=BuiltIn().get_variable_value('\${TEST NAME}'),
            suite_name=BuiltIn().get_variable_value('\${SUITE NAME}'),
            capture_dom=capture_dom,
            clip_selector=clip_selector,
            ignore_regions=parsed_ignore_regions,
            full_page_config=parsed_fpc,
            diffing_method=diffing_method,
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
