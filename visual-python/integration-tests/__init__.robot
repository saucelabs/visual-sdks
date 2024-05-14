*** Settings ***
Resource    resource.robot
Suite Setup    Setup
Suite Teardown    Teardown

*** Keywords ***
Setup
    Create Visual Build    name=Robot Framework Integration Tests    project=visual-sdks/visual-python

Teardown
    Finish Visual Build
    Visual Build Status
