*** Settings ***
Documentation     A test suite with test for various clipping utilities.
Resource          resource.robot
Test Timeout    5 minutes

*** Test Cases ***
Full Page Screenshot
    Visual Snapshot    Bool    full_page_config=True
    Visual Snapshot    Scroll Limit    full_page_config={"scroll_limit": 1}
    Visual Snapshot    Enable Scroll Bars    full_page_config={"hide_scroll_bars": False}
    ${config} =     Visual FullPageConfig    scroll_limit=1
    Visual Snapshot    Config Object    full_page_config=${config}
