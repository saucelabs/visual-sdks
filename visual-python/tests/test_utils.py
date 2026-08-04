from unittest.mock import Mock

from saucelabs_visual.typing import FullPageConfig, IgnoreRegion
from saucelabs_visual.utils import format_full_page_config, is_valid_ignore_region


class TestIsValidIgnoreRegion:
    def test_parse_valid_region(self):
        result = is_valid_ignore_region(IgnoreRegion(
            x=100,
            y=100,
            height=100,
            width=100
        ))
        assert result is True

    def test_parse_valid_region_zero_x_or_y(self):
        result = is_valid_ignore_region(IgnoreRegion(
            x=0,
            y=100,
            height=100,
            width=100
        ))
        assert result is True

        result = is_valid_ignore_region(IgnoreRegion(
            x=100,
            y=0,
            height=100,
            width=100
        ))
        assert result is True

    def test_parse_zero_width_or_height(self):
        result = is_valid_ignore_region(IgnoreRegion(
            x=100,
            y=100,
            height=100,
            width=0
        ))
        assert result is False

        result = is_valid_ignore_region(IgnoreRegion(
            x=100,
            y=100,
            height=0,
            width=0,
        ))
        assert result is False


class TestFormatFullPageConfig:
    def test_none_config(self):
        assert format_full_page_config(None) is None

    def test_config_without_scroll_element(self):
        result = format_full_page_config(FullPageConfig(scrollLimit=5))
        assert result['scrollLimit'] == 5
        assert 'scroll_element' not in result
        assert 'scrollElement' not in result

    def test_config_with_scroll_element(self):
        element = Mock()
        element.id = '1B000000-0000-0000-5803-000000000000'
        result = format_full_page_config(FullPageConfig(
            scrollLimit=10,
            scroll_element=element,
        ))
        assert result['scrollElement'] == '1B000000-0000-0000-5803-000000000000'
        assert result['scrollLimit'] == 10
        assert 'scroll_element' not in result
