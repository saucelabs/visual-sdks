using System;
using System.Threading.Tasks;
using NUnit.Framework;
using OpenQA.Selenium.Remote;

namespace SauceLabs.Visual.IntegrationTests
{
    [TestFixture]
    [Parallelizable(ParallelScope.Children)]
    public class ParallelVisualTests
    {
        private static readonly string BuildName = "Visual .NET SDK Parallel Tests";
        private static readonly string BuildNumber = $"{DateTime.Now:yyyyMMdd-HHmmss}";
        
        [OneTimeTearDown]
        public static async Task CleanupAllTests()
        {
            await VisualClient.Finish();
            TestContext.WriteLine("All builds have been closed.");
        }
            
        [TestFixture]
        [Parallelizable(ParallelScope.All)]
        public class LoginPageTest
        {
            [Test, IntegrationTest]
            public async Task NavigateTest()
            {
                RemoteWebDriver? driver = null;
                VisualClient? visualClient = null;

                try
                {
                    var buildOptions = new CreateBuildOptions
                    {
                        Name = BuildName,
                        Project = "Integration Tests",
                    };

                    var browserOptions = Utils.GetBrowserOptions();
                    var sauceOptions = Utils.GetSauceOptions();
                    sauceOptions.Add("build", $"{BuildName}: {BuildNumber}");
                    sauceOptions.Add("name", TestContext.CurrentContext.Test.Name);
                    browserOptions.AddAdditionalOption("sauce:options", sauceOptions);
                    var sauceUrl = Utils.GetOnDemandURL();
                    driver = new RemoteWebDriver(sauceUrl, browserOptions);
                    
                    visualClient = await VisualClient.Create(driver, buildOptions);
                    
                    driver.Navigate().GoToUrl("https://www.saucedemo.com");

                    var checkOptions = new VisualCheckOptions
                    {
                        SuiteName = GetType().Name,
                        TestName = TestContext.CurrentContext.Test.Name
                    };

                    await visualClient.VisualCheck("Login Page", checkOptions);
                    
                    TestContext.WriteLine($"{TestContext.CurrentContext.Test.Name} completed at: {DateTime.Now:HH:mm:ss.fff}");
                }
                finally
                {
                    try
                    {
                        var isPassed = TestContext.CurrentContext.Result.Outcome.Status == NUnit.Framework.Interfaces.TestStatus.Passed;
                        driver?.ExecuteScript("sauce:job-result=" + (isPassed ? "passed" : "failed"));
                        driver?.Quit();
                        visualClient?.Dispose();
                    }
                    catch (Exception ex)
                    {
                        TestContext.Error.WriteLine($"Error during cleanup: {ex.Message}");
                    }
                }
            }
        }

        [TestFixture]
        [Parallelizable(ParallelScope.All)]
        public class InventoryPageTest
        {
            [Test, IntegrationTest]
            public async Task NavigateTest()
            {
                RemoteWebDriver? driver = null;
                VisualClient? visualClient = null;

                try
                {
                    var buildOptions = new CreateBuildOptions
                    {
                        Name = BuildName,
                        Project = "Integration Tests",
                    };

                    var browserOptions = Utils.GetBrowserOptions();
                    var sauceOptions = Utils.GetSauceOptions();
                    sauceOptions.Add("build", $"{BuildName}: {BuildNumber}");
                    sauceOptions.Add("name", TestContext.CurrentContext.Test.Name);
                    browserOptions.AddAdditionalOption("sauce:options", sauceOptions);
                    var sauceUrl = Utils.GetOnDemandURL();
                    driver = new RemoteWebDriver(sauceUrl, browserOptions);
                    
                    visualClient = await VisualClient.Create(driver, buildOptions);
                    
                    driver.Navigate().GoToUrl("https://www.saucedemo.com/inventory.html");

                    var checkOptions = new VisualCheckOptions
                    {
                        SuiteName = GetType().Name,
                        TestName = TestContext.CurrentContext.Test.Name
                    };

                    await visualClient.VisualCheck("Inventory Page", checkOptions);
                    
                    TestContext.WriteLine($"{TestContext.CurrentContext.Test.Name} completed at: {DateTime.Now:HH:mm:ss.fff}");
                }
                finally
                {
                    try
                    {
                        var isPassed = TestContext.CurrentContext.Result.Outcome.Status == NUnit.Framework.Interfaces.TestStatus.Passed;
                        driver?.ExecuteScript("sauce:job-result=" + (isPassed ? "passed" : "failed"));
                        driver?.Quit();
                        visualClient?.Dispose();
                    }
                    catch (Exception ex)
                    {
                        TestContext.Error.WriteLine($"Error during cleanup: {ex.Message}");
                    }
                }
            }
        }
    }
}