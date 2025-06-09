using System;
using System.Threading.Tasks;
using NUnit.Framework;
using OpenQA.Selenium.Remote;

namespace SauceLabs.Visual.IntegrationTests;

[Parallelizable(ParallelScope.Children)]
[IntegrationTest(skipIfSingle: true)]
public class LoginPageConcurrent
{
    private VisualClient? VisualClient { get; set; }

    [OneTimeSetUp]
    public async Task Setup()
    {
        VisualClient = await VisualClient.Create();
        TestContext.Progress.WriteLine($"Build: {VisualClient.Build.Url}");
    }

    [Test]
    public async Task LoginPage_ShouldOpen1()
    {
        await UsingDriver(async (driver) =>
        {
            driver.Navigate().GoToUrl("https://www.saucedemo.com");
            await VisualClient.VisualCheck(driver, "Login Page");
        });
    }

    [Test]
    public async Task LoginPage_ShouldOpen2()
    {
        await UsingDriver(async (driver) =>
        {
            driver.Navigate().GoToUrl("https://www.saucedemo.com");
            await VisualClient.VisualCheck(driver, "Login Page");
        });
    }

    [Test]
    public async Task LoginPage_ShouldOpen3()
    {
        await UsingDriver(async (driver) =>
        {
            driver.Navigate().GoToUrl("https://www.saucedemo.com");
            await VisualClient.VisualCheck(driver, "Login Page");
        });
    }

    private async Task UsingDriver(Func<RemoteWebDriver, Task> func)
    {
        var browserOptions = Utils.GetBrowserOptions();
        var sauceOptions = Utils.GetSauceOptions();
        browserOptions.AddAdditionalOption("sauce:options", sauceOptions);

        var sauceUrl = Utils.GetOnDemandURL();

        var driver = new RemoteWebDriver(sauceUrl, browserOptions);
        try
        {
            await func(driver);
        }
        finally
        {
            driver.Quit();
        }
    }

    [OneTimeTearDown]
    public async Task Teardown()
    {
        await VisualClient.Finish();
        VisualClient.Dispose();
    }
}
