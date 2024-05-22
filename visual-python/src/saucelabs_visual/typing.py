from dataclasses import dataclass, InitVar, asdict
from enum import Enum
from typing import List, Union, Literal

from selenium.webdriver.remote.webelement import WebElement
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


@dataclass(kw_only=True)
class IgnoreBase:
    enable_only: InitVar[Union[List[
        Literal['content', 'dimensions', 'position', 'structure', 'style', 'visual']
    ], None]] = None
    disable_only: InitVar[Union[List[
        Literal['content', 'dimensions', 'position', 'structure', 'style', 'visual']
    ], None]] = None

    def __post_init__(
            self,
            enable_only: Union[List[
                Literal['content', 'dimensions', 'position', 'structure', 'style', 'visual']
            ], None],
            disable_only: Union[List[
                Literal['content', 'dimensions', 'position', 'structure', 'style', 'visual']
            ], None],
    ):
        all_keys = ['content', 'dimensions', 'position', 'structure', 'style', 'visual']

        if enable_only:
            self.diffingOptions = {
                **dict.fromkeys(all_keys, False),
                **dict.fromkeys(enable_only, True),
            }

        if disable_only:
            self.diffingOptions = {
                **dict.fromkeys(all_keys, True),
                **dict.fromkeys(disable_only, False),
            }


@dataclass
class IgnoreRegion(IgnoreBase):
    x: int
    y: int
    height: int
    width: int
    diffingOptions: Union[DiffingOptions, None] = None
    name: Union[str, None] = None


@dataclass
class IgnoreElementRegion(IgnoreBase):
    element: Union[WebElement, List[WebElement]]
    diffingOptions: Union[DiffingOptions, None] = None
    name: Union[str, None] = None

    def as_dict_array(self):
        element_array = self.element if isinstance(self.element, List) else [self.element]
        return [
            {
                "id": element.id,
                "diffingOptions": self.diffingOptions,
                "name": self.name,
            } for element in element_array
        ]


@dataclass
class FullPageConfig:
    delayAfterScrollMs: Union[int, None] = None
    """
    Delay in ms after scrolling and before taking screenshots. A slight delay can be helpful for
    websites leveraging lazy loading.
    """
    hideAfterFirstScroll: Union[List[str], None] = None
    """
    A list of CSS selectors for elements to hide after the first scroll.
    """
    disableCSSAnimation: Union[bool, None] = None
    """
    Disable CSS animations and the input caret for the site under test.
    """
    hideScrollBars: Union[bool, None] = None
    """
    Hide all scrollbars for the site under test.
    """
    scrollLimit: Union[int, None] = None
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
