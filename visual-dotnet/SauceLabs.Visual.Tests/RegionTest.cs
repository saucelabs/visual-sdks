using NUnit.Framework;

namespace SauceLabs.Visual.Tests;

public class RegionTest
{
    [TestCase("us-west-1", "https://api.us-west-1.saucelabs.com/v1/visual/graphql")]
    [TestCase("us-east-4", "https://api.us-east-4.saucelabs.com/v1/visual/graphql")]
    [TestCase("eu-central-1", "https://api.eu-central-1.saucelabs.com/v1/visual/graphql")]
    [TestCase("asia-south-2", "https://api.asia-south-2.saucelabs.com/v1/visual/graphql")]
    [TestCase("staging", "https://api.staging.saucelabs.net/v1/visual/graphql")]
    public void FromName_ReturnsRegionWithItsEndpoint(string name, string endpoint)
    {
        var region = Region.FromName(name);
        Assert.That(region.Name, Is.EqualTo(name));
        Assert.That(region.Value, Is.EqualTo(new System.Uri(endpoint)));
    }

    [Test]
    public void FromName_AsiaSouth2_EqualsStaticRegion()
    {
        Assert.That(Region.FromName("asia-south-2"), Is.EqualTo(Region.AsiaSouth2));
    }

    [Test]
    public void FromName_UnknownRegion_Throws()
    {
        Assert.Throws<VisualClientException>(() => Region.FromName("mars-1"));
    }
}
