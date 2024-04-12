from ast import literal_eval
from typing import List, Union

from SeleniumLibrary import SeleniumLibrary
from robot.api.deco import library, keyword
from robot.libraries.BuiltIn import BuiltIn

from saucelabs_visual.client import SauceLabsVisual as Client
from saucelabs_visual.typing import IgnoreRegion, FullPageConfig


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

    @keyword(name="Create Visual Build")
    def create_visual_build(
            # Params 'duplicated' here, so we get type casting and named parameters provided by
            # Robot Framework for free.
            self,
            name: str = None,
            project: str = None,
            branch: str = None,
            default_branch: str = None,
            custom_id: str = None,
            keep_alive_timeout: int = None
    ):
        return self.client.create_build(
            name=name,
            project=project,
            branch=branch,
            default_branch=default_branch,
            custom_id=custom_id,
            keep_alive_timeout=keep_alive_timeout,
        )

    @keyword(name="Finish Visual Build")
    def finish_visual_build(self):
        return self.client.finish_build()

    @keyword(name="Visual Snapshot")
    def visual_snapshot(
            # Params 'duplicated' here, so we get type casting and named parameters provided by
            # Robot Framework for free.
            self,
            name: str,
            capture_dom: bool = False,
            clip_selector: str = None,
            ignore_regions: List[IgnoreRegion] = None,
            full_page_config: str = None,
    ):
        session_id = self._get_selenium_id()

        # Robot fails when attempting to parse a TypedDict out of a Union -- and converters are not
        # triggered. So, allow the default value as a string then parse it ourselves to allow us
        # to set proper default / optional values.
        parsed_fpc = self._parse_full_page_config(full_page_config) if (
                    type(full_page_config) is str) else None

        return self.client.create_snapshot_from_webdriver(
            name=name,
            session_id=session_id,
            test_name=BuiltIn().get_variable_value('\${TEST NAME}'),
            suite_name=BuiltIn().get_variable_value('\${SUITE NAME}'),
            capture_dom=capture_dom,
            clip_selector=clip_selector,
            ignore_regions=ignore_regions,
            full_page_config=parsed_fpc,
        )
