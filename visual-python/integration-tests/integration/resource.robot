*** Settings ***
Documentation     A resource file with reusable keywords and variables.
...
...               The system specific keywords created here form our own
...               domain specific language. They utilize keywords provided
...               by the imported SeleniumLibrary.
Library           SeleniumLibrary    AS    slib
Library           saucelabs_visual.frameworks.robot.SauceLabsVisual
Library           Collections

*** Variables ***
${BROWSER}        Chrome
${DELAY}          0
${LOGIN URL}      https://www.saucedemo.com/
${INVENTORY PAGE}    https://www.saucedemo.com/inventory.html

*** Keywords ***
Setup Remote URL
    TRY
        IF    "%{SAUCE_REGION}"
            VAR    ${REMOTE URL}    https://ondemand.%{SAUCE_REGION}.saucelabs.com:443/wd/hub    scope=GLOBAL
        ELSE
            VAR    ${REMOTE URL}    https://ondemand.us-west-1.saucelabs.com:443/wd/hub    scope=GLOBAL
        END
    EXCEPT
        VAR    ${REMOTE URL}    https://ondemand.us-west-1.saucelabs.com:443/wd/hub    scope=GLOBAL
    END

Open Mobile Browser
    ${DESIRED CAPABILITIES} =    Set Variable    {"username": "%{SAUCE_USERNAME}", "accessKey": "%{SAUCE_ACCESS_KEY}", "browser_version": "latest", "platform_name": "Android", "browser": "chrome", "screenResolution": "1920x1080", "appiumVersion": "2.0.0"}
    Open Browser    browser=${BROWSER}    remote_url=${REMOTE URL}    options=set_capability('platformName', 'Android');set_capability('appium:automationName', 'UiAutomator2');set_capability('appium:deviceName', 'Android GoogleAPI Emulator');set_capability("appium:platformVersion", "14.0");set_capability('sauce:options', ${DESIRED CAPABILITIES})

Open Desktop Browser
    ${DESIRED CAPABILITIES} =    Set Variable    {"username": "%{SAUCE_USERNAME}", "accessKey": "%{SAUCE_ACCESS_KEY}", "browser_version": "latest", "platform_name": "Windows 11", "browser": "chrome", "screenResolution": "1920x1080"}
    Open Browser    browser=${BROWSER}    remote_url=${REMOTE URL}    options=set_capability('sauce:options', ${DESIRED CAPABILITIES})

Setup Suite
    Setup Remote URL

Setup Desktop Suite
    Setup Remote URL
    Open Desktop Browser

Setup Mobile Suite
    Setup Remote URL
    Open Mobile Browser

Teardown Suite
    Close Browser

Open Browser To Login Page
    Go To    ${LOGIN URL}
    Maximize Browser Window
    Set Selenium Speed    ${DELAY}
    Login Page Should Be Open

Login Page Should Be Open
    Location Should Be    ${LOGIN URL}
    Title Should Be    Swag Labs

Open Browser To Sauce Home Page
    Go To    ${SAUCE HOME PAGE}
    Maximize Browser Window
    Set Selenium Speed    ${DELAY}
    Sauce Home Page Should Be Open

Sauce Home Page Should Be Open
    Location Should Be    ${SAUCE HOME PAGE}
    Title Should Be    Sauce Labs: Cross Browser Testing, Selenium Testing & Mobile Testing

Open Browser To Sauce Docs
    Go To    ${SAUCE DOCS PAGE}
    Maximize Browser Window
    Set Selenium Speed    ${DELAY}
    Sauce Docs Should Be Open

Sauce Docs Should Be Open
    Location Should Be    ${SAUCE DOCS PAGE}
    Title Should Be    Appium Versions | Sauce Labs Documentation

Go To Login Page
    Go To    ${LOGIN URL}
    Login Page Should Be Open

Input Username
    [Arguments]    ${username}
    Input Text    user-name    ${username}

Input Password
    [Arguments]    ${password}
    Input Text    password    ${password}

Submit Credentials
    Click Button    login-button

Welcome Page Should Be Open
    Location Should Be    ${INVENTORY PAGE}
    Title Should Be    Swag Labs

Setup User
    TRY
        IF    "%{VISUAL_CHECK}" == "1"
            VAR    ${username}    visual_user
        ELSE
            VAR    ${username}    standard_user
        END
    EXCEPT
        VAR    ${username}    standard_user
    END
    RETURN    ${username}

Run Test
    # Login and navigate to the inventory page
    Open Browser To Login Page
    ${username} =     Setup User
    Input Username    ${username}
    Input Password    secret_sauce
    Submit Credentials
    Welcome Page Should Be Open
