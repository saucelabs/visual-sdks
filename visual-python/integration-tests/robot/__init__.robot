*** Variables ***
${NO_BUILD_NAME}    False

*** Settings ***
Resource    resource.robot
Suite Setup    Setup
Suite Teardown    Teardown

*** Keywords ***
Setup
    Run Keyword If    '${NO_BUILD_NAME}' == 'False'    Setup Default
    Run Keyword If    '${NO_BUILD_NAME}' == 'True'     Setup without Build Name

Setup Default
    Create Visual Build    name=Robot Framework Integration Tests    project=visual-sdks/visual-python

Setup without Build Name
    # Build name and other build customizations to be passed with environment variables
    Create Visual Build

Teardown
    Finish Visual Build
