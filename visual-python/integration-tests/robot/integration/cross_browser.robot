*** Settings ***
Resource          resource.robot
Test Timeout    5 minutes

*** Test Cases ***
Baseline
    
    Visual Set Global DiffingMethod    BALANCED
    Visual Set Global CaptureDom    True
    ${override} =    Visual BaselineOverride    device=Desktop (1920x900)    browser=CHROME    browser_version=127.0
    Visual Set Global BaselineOverride    ${override}
    ${full_page_config} =    Visual FullPageConfig
    Visual Set Global FullPageConfig    ${full_page_config}
    Visual Snapshot     Inventory Page

    ${override} =    Visual BaselineOverride    device=Desktop (1920x900)    browser=CHROME    browser_version=127.0
    ${fpc} =     Visual FullPageConfig    scroll_limit=1
    Visual Snapshot    Inventory Page (Override)    baseline_override=${override}    full_page_config=${fpc}    diffing_method=SIMPLE    capture_dom=False


    Visual Set Global DiffingMethod    None
    Visual Set Global CaptureDom    None
    Visual Set Global BaselineOverride    None
    Visual Set Global FullPageConfig    None
