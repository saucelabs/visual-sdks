using System;
using System.Collections.Generic;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Firefox;
using OpenQA.Selenium.Safari;

namespace SauceLabs.Visual.IntegrationTests;

internal static class Utils
{
    public static Dictionary<string, string> GetSauceOptions()
    {
        return new Dictionary<string, string>
        {
            { "username", GetSauceUsername() },
            { "accessKey", GetSauceAccessKey() }
        };
    }

    public static string GetSauceUsername()
    {
        var username = Environment.GetEnvironmentVariable("SAUCE_USERNAME");
        if (string.IsNullOrEmpty(username))
        {
            throw new Exception("No SAUCE_USERNAME found");
        }

        return username;
    }

    public static string GetSauceAccessKey()
    {
        var accessKey = Environment.GetEnvironmentVariable("SAUCE_ACCESS_KEY");
        if (string.IsNullOrEmpty(accessKey))
        {
            throw new Exception("No SAUCE_ACCESS_KEY found");
        }

        return accessKey;
    }

    public static Region GetSauceRegion()
    {
        var region = Environment.GetEnvironmentVariable("SAUCE_REGION");
        if (string.IsNullOrEmpty(region))
        {
            return Region.UsWest1;
        }

        return Region.FromName(region);
    }

    public static Uri GetOnDemandURL()
    {
        var regionName = GetSauceRegion();
        var tld = regionName.Name == "staging" ? "net" : "com";
        return new Uri("https://ondemand." + regionName.Name + ".saucelabs." + tld + "/wd/hub");
    }

    public static DriverOptions GetBrowserOptions()
    {
        var browser = Environment.GetEnvironmentVariable("BROWSER_NAME");
        DriverOptions browserOptions = browser switch
        {
            "Firefox" => new FirefoxOptions(),
            "Safari" => new SafariOptions(),
            _ => new ChromeOptions(),
        };

        browserOptions.PlatformName =
            Environment.GetEnvironmentVariable("PLATFORM_NAME") ?? "Windows 11";
        browserOptions.BrowserVersion =
            Environment.GetEnvironmentVariable("BROWSER_VERSION") ?? "latest";
        return browserOptions;
    }
}
