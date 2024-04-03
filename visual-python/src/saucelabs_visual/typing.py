from typing import TypedDict, List, Optional


class IgnoreRegion(TypedDict):
    x: int
    y: int
    height: int
    width: int


class FullPageConfig(TypedDict):
    delay_after_scroll_ms: Optional[int]
    hide_after_first_scroll: Optional[List[str]]
