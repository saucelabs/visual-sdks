*** Settings ***
Resource    resource.robot
Suite Setup    Setup
Suite Teardown    Close Browser


*** Keywords ***
Setup
    Setup Suite
    Open Desktop Browser
    Run Test
