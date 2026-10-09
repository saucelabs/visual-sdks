import pytest

from saucelabs_visual.regions import Region, regions


class TestRegions:
    def test_names_and_aliases_are_unique(self):
        names = [name for r in regions for name in [r.name, *r.aliases]]
        assert len(names) == len(set(names))

    @pytest.mark.parametrize("name", ["asia-south-2", "asia"])
    def test_asia_south_2_by_name_and_alias(self, name):
        region = Region.from_name(name)
        assert region.name == "asia-south-2"
        assert region.graphql_endpoint == 'https://api.asia-south-2.saucelabs.com/v1/visual/graphql'
        assert region.job_url("4242") == 'https://app.asia-south-2.saucelabs.com/tests/4242'

    def test_unknown_region_is_rejected(self):
        with pytest.raises(Exception):
            Region.from_name("mars-1")
