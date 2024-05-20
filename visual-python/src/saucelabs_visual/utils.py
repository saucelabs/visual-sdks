from tabulate import tabulate

from saucelabs_visual.typing import IgnoreRegion, BuildMode, BuildStatus, DiffingOptions


def ignore_region_from_dict(
        region: dict,
        name: str = None,
        diffing_options: DiffingOptions = None,
) -> IgnoreRegion:
    """
    Parses & casts values inside an ignore region dict.
    :param name:
    :param diffing_options:
    :param region:
    :return:
    """
    ignore_region = IgnoreRegion(
        width=int(region.get('width')),
        height=int(region.get('height')),
        x=int(region.get('x')),
        y=int(region.get('y')),
        name=name,
        diffingOptions=diffing_options,
    )

    return ignore_region


def is_valid_ignore_region(region: IgnoreRegion) -> bool:
    """
    Checks if 'region' is valid for parsing & handling by the API.
    :param region:
    :return:
    """
    return (
            type(region.width) is int and
            type(region.height) is int and
            type(region.x) is int and
            type(region.y) is int and
            region.width > 0 and
            region.height > 0 and
            region.x >= 0 and
            region.y >= 0
    )


def create_table_from_build_status(result: dict):
    status = result.get('result')

    values = {
        'Approved': status.get('approvedCount'),
        'Equal': status.get('equalCount'),
        'Errored': status.get('erroredCount'),
        'Queued': status.get('queuedCount'),
        'Rejected': status.get('rejectedCount'),
        'Unapproved': status.get('unapprovedCount'),
    }.items()
    return tabulate(tabular_data=values, tablefmt='grid', headers=['Status', 'Count'])


def is_build_errored(build: dict):
    """
    Checks to see if a build is in an "errored" state -- meaning the build is still in a
    non-completed state, or an error has been found on a diff or the build itself.
    :param build: A dict returned by the client get_build_status method.
    :return:
    """
    result = build['result']
    if result['mode'] == BuildMode.RUNNING.value or (
            result['mode'] == BuildMode.COMPLETED.value and
            result['status'] == BuildStatus.ERRORED
    ):
        return True
    return False


def is_build_failed(build: dict):
    """
    Checks to see if a build is in a "failed" state -- meaning the build successfully finished
    and one or more differences was found.
    :param build: A dict returned by the client get_build_status method.
    :return:
    """
    result = build['result']
    if result['mode'] == BuildMode.COMPLETED.value and result['status'] not in [
        BuildStatus.APPROVED.value,
        BuildStatus.EQUAL.value,
    ]:
        return True
    return False
