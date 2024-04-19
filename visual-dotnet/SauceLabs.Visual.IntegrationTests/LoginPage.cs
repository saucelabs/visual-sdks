using System.Threading.Tasks;
using NUnit.Framework;
using OpenQA.Selenium.Remote;

namespace SauceLabs.Visual.IntegrationTests;

public class LoginPage
{
    private RemoteWebDriver? Driver { get; set; }
    private VisualClient? VisualClient { get; set; }

    [SetUp]
    public async Task Setup()
    {
        var browserOptions = Utils.GetBrowserOptions();
        var sauceOptions = Utils.GetSauceOptions();
        browserOptions.AddAdditionalOption("sauce:options", sauceOptions);

        var sauceUrl = Utils.GetOnDemandURL();
        Driver = new RemoteWebDriver(sauceUrl, browserOptions);
        Driver.ExecuteScript("sauce:job-name=NUnit C#/.Net Visual Session");

        VisualClient = await VisualClient.Create(Driver, Region.UsWest1);
        TestContext.Progress.WriteLine($"Build: {VisualClient.Build.Url}");
    }

    [IntegrationTest]
    [Test]
    public async Task LoginPage_ShouldOpen()
    {
        Driver.Navigate().GoToUrl("https://www.saucedemo.com");
        await VisualClient.VisualCheck("Login Page");
    }

    [OneTimeTearDown]
    public async Task Teardown()
    {
        Driver?.Quit();
        VisualClient?.Dispose();
    }
}