from typing import Union, List


class Region:
    name: str
    aliases: List[str] = []
    graphql_endpoint: str
    job_url_template: str
    visual_url_template: str

    def __init__(
            self,
            name: str,
            aliases: List[str],
            graphql_endpoint: str,
            job_url_template: str,
            visual_url_template: str,
    ):
        self.name = name
        self.aliases = aliases
        self.graphql_endpoint = graphql_endpoint
        self.job_url_template = job_url_template
        self.visual_url_template = visual_url_template

    def job_url(self, job_id: str) -> str:
        return self.job_url_template.format(JOB_ID=job_id)

    def build_url(self, build_id: str) -> str:
        return self.visual_url_template.format(BUILD_ID=build_id)

    @staticmethod
    def from_name(region_name: str) -> 'Region':
        region: Union[Region, None] = None

        for i, v in enumerate(regions):
            if v.name == region_name or region_name in v.aliases:
                region = v
                break

        if region is None:
            raise Exception(f'"{region_name}" is not recognized as a Sauce Labs region.')

        return region


regions = [
    Region(
        name="staging",
        aliases=["us-west-4-jeh6"],
        graphql_endpoint='https://api.staging.saucelabs.net/v1/visual/graphql',
        job_url_template='https://app.staging.saucelabs.net/tests/{JOB_ID}',
        visual_url_template='https://app.saucelabs.com/visual/builds/{BUILD_ID}',
    ),
    Region(
        name="us-east-4",
        aliases=["us-east-4-cm5i"],
        graphql_endpoint='https://api.us-east-4.saucelabs.com/v1/visual/graphql',
        job_url_template='https://app.us-east-4.saucelabs.com/tests/{JOB_ID}',
        visual_url_template='https://app.us-east-4.saucelabs.com/visual/builds/{BUILD_ID}',
    ),
    Region(
        name="eu-central-1",
        aliases=["eu", "eu-west-3-lnbf"],
        graphql_endpoint='https://api.eu-central-1.saucelabs.com/v1/visual/graphql',
        job_url_template='https://app.eu-central-1.saucelabs.com/tests/{JOB_ID}',
        visual_url_template='https://app.eu-central-1.saucelabs.com/visual/builds/{BUILD_ID}',
    ),
    Region(
        name="us-west-1",
        aliases=['us', 'us-west-4-i3er'],
        graphql_endpoint='https://api.us-west-1.saucelabs.com/v1/visual/graphql',
        job_url_template='https://app.saucelabs.com/tests/{JOB_ID}',
        visual_url_template='https://app.saucelabs.com/visual/builds/{BUILD_ID}',
    ),
]
