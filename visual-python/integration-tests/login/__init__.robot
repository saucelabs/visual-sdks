*** Settings ***
Resource    resource.robot
Suite Setup    Setup
Suite Teardown    Teardown

*** Keywords ***
Setup
    Create Visual Build

Teardown
    Finish Visual Build
    Visual Build Status
