from enum import Enum
from typing import List

from typing_extensions import TypedDict, NotRequired


class DiffingOptions(TypedDict):
    """
    Customize Visual diffing behavior when a DOM capture is present on the BALANCED diffing method.
    See docs for more information:
    https://docs.saucelabs.com/visual-testing/selective-diffing/
    """
    content: NotRequired[bool]
    dimensions: NotRequired[bool]
    position: NotRequired[bool]
    structure: NotRequired[bool]
    style: NotRequired[bool]
    visual: NotRequired[bool]


class IgnoreRegion(TypedDict):
    x: int
    y: int
    height: int
    width: int
    diffingOptions: NotRequired[DiffingOptions]
    name: NotRequired[dict]

class FullPageConfig(TypedDict):
    delay_after_scroll_ms: NotRequired[int]
    """
    Delay in ms after scrolling and before taking screenshots. A slight delay can be helpful for
    websites leveraging lazy loading.
    """
    hide_after_first_scroll: NotRequired[List[str]]
    """
    Hide elements on the page after first scroll by css selectors.
    """
    address_bar_shadow_padding: NotRequired[int]
    """
    Adjust address bar padding on iOS and Android for viewport cutout.
    """
    disable_css_animation: NotRequired[bool]
    """
    Disable CSS animations and the input caret for the site under test.
    """
    hide_scroll_bars: NotRequired[bool]
    """
    Hide all scrollbars for the site under test.
    """
    tool_bar_shadow_padding: NotRequired[int]
    """
    Adjust toolbar padding on iOS and Android for viewport cutout.
    """
    scroll_limit: NotRequired[int]
    """
    Limit the number of screenshots taken for scrolling and stitching. Default and max value is 10.
    """


class DiffingMethod(Enum):
    BALANCED = 'BALANCED'
    EXPERIMENTAL = 'EXPERIMENTAL'
    SIMPLE = 'SIMPLE'


class BuildMode(Enum):
    COMPLETED = 'COMPLETED'
    RUNNING = 'RUNNING'


class BuildStatus(Enum):
    APPROVED = 'APPROVED'
    EMPTY = 'EMPTY'
    EQUAL = 'EQUAL'
    ERRORED = 'ERRORED'
    QUEUED = 'QUEUED'
    REJECTED = 'REJECTED'
    RUNNING = 'RUNNING'
    UNAPPROVED = 'UNAPPROVED'
