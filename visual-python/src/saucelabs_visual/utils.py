from saucelabs_visual.typing import IgnoreRegion
from tabulate import tabulate


def ignore_region_from_dict(region: dict) -> IgnoreRegion:
    """
    Parses & casts values inside an ignore region dict.
    :param region:
    :return:
    """
    ignore_region = IgnoreRegion(
        width=int(region.get('width')),
        height=int(region.get('height')),
        x=int(region.get('x')),
        y=int(region.get('y')),
    )

    return ignore_region


def is_valid_ignore_region(region: IgnoreRegion) -> bool:
    """
    Checks if 'region' is valid for parsing & handling by the API.
    :param region:
    :return:
    """
    return (
            type(region['width']) is int and
            type(region['height']) is int and
            type(region['x']) is int and
            type(region['y']) is int and
            region['width'] > 0 and
            region['height'] > 0 and
            region['x'] >= 0 and
            region['y'] >= 0
    )


def create_table_from_build_status(result):
    status = result['result']
    values = {
        'Approved': status.get('approvedCount'),
        'Equal': status.get('equalCount'),
        'Errored': status.get('erroredCount'),
        'Queued': status.get('queuedCount'),
        'Rejected': status.get('rejectedCount'),
        'Unapproved': status.get('unapprovedCount'),
    }.items()
    return tabulate(tabular_data=values, tablefmt='grid', headers=['Status', 'Count'])
