from enum import Enum
from typing import List

from typing_extensions import TypedDict, NotRequired


class DiffingOptions(TypedDict):
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
    hide_after_first_scroll: NotRequired[List[str]]


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
