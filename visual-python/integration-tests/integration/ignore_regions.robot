*** Settings ***
Documentation     A test suite with a single test for valid login.
...
...               This test has a workflow that is created using keywords in
...               the imported resource file.
Resource          resource.robot
Suite Setup    Setup Suite
Test Timeout    5 minutes


*** Keywords ***
Cropping FPS Suite
    Run Test
    Visual Snapshot    Standard    ignore_regions=["class:inventory_item_img", "class:btn_inventory"]    capture_dom=True
    Visual Snapshot    Clipped    ignore_regions=["class:inventory_item_img", "class:btn_inventory"]    clip_selector=.inventory_list    capture_dom=True
    Visual Snapshot    FPS    ignore_regions=["class:inventory_item_img", "class:btn_inventory"]    full_page_config=True    capture_dom=True
    Visual Snapshot    Clipped (FPS)    ignore_regions=["class:inventory_item_img", "class:btn_inventory"]    clip_selector=.inventory_list     full_page_config=True    capture_dom=True

*** Test Cases ***
Desktop Cropping
    Open Desktop Browser
    Cropping FPS Suite
    Close Browser

Mobile Cropping
    Open Mobile Browser
    Cropping FPS Suite
    Close Browser

Ignore Region Parsing
    Open Desktop Browser
    Run Test
    
    # An array of web elements in ignore region
    ${elements}    Get Webelements    class:inventory_item_img
    ${inventory_images} =     Visual Ignore Element    ${elements}    diffing_options={"style": True}

    # Single element to ignore
    ${atc_button_element}    Get Webelement    class:btn_inventory
    ${first_add_to_cart_button} =     Visual Ignore Element    ${atc_button_element}

    # Manually creating ignore region
    ${ignore_region_dict} =     Visual Ignore Region    x=100    y=100    width=100    height=100    diffing_options={"style": True}

    # Parsing a dict as an ignore region (fallback support, really).
    ${dict} =    Evaluate    {"x": 200, "y": 200, "width": 200, "height": 200}

    # Combine multiple items into list and pass as values
    ${ignore_regions} =    Create List    ${inventory_images}    ${first_add_to_cart_button}    ${ignore_region_dict}    ${atc_button_element}    ${dict}    class:inventory_item_label
    
    Visual Snapshot    Ignore Regions List    capture_dom=True    ignore_regions=${ignore_regions}    full_page_config=True    diffing_method=BALANCED
    Visual Snapshot    Inline Dict    capture_dom=True    ignore_regions=[{"x": 200, "y": 200, "width": 200, "height": 200}]    full_page_config=True    diffing_method=BALANCED
    
    Close Browser
