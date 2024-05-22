*** Settings ***
Documentation     A test suite with test for various clipping utilities.
Resource          resource.robot
Test Timeout    5 minutes

*** Test Cases ***
Clipping
    Visual Snapshot    Clip Selector    clip_selector=.inventory_list
    # Should fail if the requested element is not found
    Run Keyword And Expect Error    STARTS:TransportQueryError    Visual Snapshot    Clip Selector    clip_selector=.no-element-found

    ${element} =    Get Webelement    class:inventory_list
    Visual Snapshot    Clip Element    clip_element=${element}
