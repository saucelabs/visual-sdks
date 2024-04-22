from saucelabs_visual.typing import IgnoreRegion
from saucelabs_visual.utils import is_valid_ignore_region


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
