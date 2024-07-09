*** Settings ***
Documentation     A test suite with a single test for login page.
...
...               This test has a workflow that is created using keywords in
...               the imported resource file.
Resource          resource.robot
Test Timeout    5 minutes

*** Test Cases ***
Login
    Visual Snapshot     Login Page