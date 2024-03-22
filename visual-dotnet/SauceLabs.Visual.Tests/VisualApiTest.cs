using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using NUnit.Framework;
using RichardSzalay.MockHttp;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Tests.Utils;

namespace SauceLabs.Visual.Tests;

public class VisualApiTest
{
    internal VisualApi<MockedWebDriver>? Api { get; set; }
    internal MockedWebDriver? WdMock { get; set; }
    internal MockHttpMessageHandler? MockedHandler { get; set; }

    private const string _jobUuid = "4f0245f2ffc9450da837a9b90c5849d1";
    private const string _username = "dummy-username";
    private const string _accessKey = "dummy-key";

    [SetUp]
    public void Setup()
    {
        MockedHandler = new MockHttpMessageHandler();

        var caps = new MockedCapabilities(new Dictionary<string, object> { { "jobUuid", _jobUuid } });
        WdMock = new MockedWebDriver(caps, _jobUuid);
        Api = new VisualApi<MockedWebDriver>(WdMock, Region.Staging, _username, _accessKey, MockedHandler.ToHttpClient());
    }

    [Test]
    public async Task TestWebDriverSessionInfo()
    {
        MockedHandler.Clear();
        var base64EncodedAuthenticationString =
            Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_username}:{_accessKey}"));
        MockedHandler
            .Expect(HttpMethod.Post, "https://api.staging.saucelabs.net/v1/visual/*")
            .WithHeaders($"Authorization: Basic {base64EncodedAuthenticationString}")
            .WithPartialContent($"\"operationName\":\"{WebDriverSessionInfoQuery.OperationName}\"")
            .Respond("application/json", "{\"data\":{\"result\":{\"blob\":\"{\\\"browser\\\":\\\"CHROME\\\",\\\"browserVersion\\\":\\\"122.0\\\",\\\"operatingSystem\\\":\\\"WINDOWS\\\",\\\"operatingSystemVersion\\\":\\\"11\\\",\\\"deviceName\\\":\\\"Desktop (0x0)\\\"}\"}}}");
        var resp = await Api.WebDriverSessionInfo(_jobUuid, _jobUuid);
        Assert.IsNotEmpty(resp?.Data.Result.Blob);
        Assert.Pass();
    }

    [Test]
    public async Task TestCreateBuildWithOnlyName()
    {
        MockedHandler.Clear();
        var base64EncodedAuthenticationString =
            Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_username}:{_accessKey}"));
        MockedHandler
            .Expect(HttpMethod.Post, "https://api.staging.saucelabs.net/v1/visual/*")
            .WithHeaders($"Authorization: Basic {base64EncodedAuthenticationString}")
            .WithPartialContent($"\"operationName\":\"{CreateBuildMutation.OperationName}\"")
            .Respond("application/json", "{\"data\":{\"result\":{\"id\":\"dummy-build-id\",\"url\":\"http://domain/dummy-build-id\",\"name\":\"dummy-name\"}}}");
        var resp = await Api.CreateBuild(new CreateBuildIn());
        Assert.AreEqual("dummy-build-id", resp?.Data.Result.Id);
        Assert.AreEqual("http://domain/dummy-build-id", resp?.Data.Result.Url);
        Assert.AreEqual("dummy-name", resp?.Data.Result.Name);
        Assert.IsNull(resp?.Data.Result.Branch);
        Assert.IsNull(resp?.Data.Result.Project);
        Assert.IsNull(resp?.Data.Result.CustomId);
    }

    [Test]
    public async Task TestCreateBuild()
    {
        MockedHandler.Clear();
        var base64EncodedAuthenticationString =
            Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_username}:{_accessKey}"));
        MockedHandler
            .Expect(HttpMethod.Post, "https://api.staging.saucelabs.net/v1/visual/*")
            .WithHeaders($"Authorization: Basic {base64EncodedAuthenticationString}")
            .WithPartialContent($"\"operationName\":\"{CreateBuildMutation.OperationName}\"")
            .Respond("application/json", "{\"data\":{\"result\":{\"id\":\"dummy-build-id\",\"url\":\"http://domain/dummy-build-id\",\"name\":\"dummy-name\",\"project\":\"project-name\",\"branch\":\"branch-name\",\"customId\":\"custom-customId\"}}}");
        var resp = await Api.CreateBuild(new CreateBuildIn());
        Assert.AreEqual("dummy-build-id", resp?.Data.Result.Id);
        Assert.AreEqual("http://domain/dummy-build-id", resp?.Data.Result.Url);
        Assert.AreEqual("custom-customId", resp?.Data.Result.CustomId);
        Assert.AreEqual("project-name", resp?.Data.Result.Project);
        Assert.AreEqual("branch-name", resp?.Data.Result.Branch);
    }

    [Test]
    public async Task TestBuildByBuildIdWithValidMode()
    {
        MockedHandler.Clear();
        var base64EncodedAuthenticationString =
            Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_username}:{_accessKey}"));
        MockedHandler
            .Expect(HttpMethod.Post, "https://api.staging.saucelabs.net/v1/visual/*")
            .WithHeaders($"Authorization: Basic {base64EncodedAuthenticationString}")
            .WithPartialContent($"\"operationName\":\"{BuildQuery.OperationName}\"")
            .Respond("application/json", "{\"data\":{\"result\":{\"id\":\"buildId\",\"url\": \"https://app.staging.saucelabs.net/visual/builds/fd54fb6f-83b7-4c0b-af8d-da2b191c0a3b\",\"name\":\"dummy-build\",\"mode\":\"COMPLETED\"}}}");
        var resp = await Api.Build("buildId");
        Assert.IsNotNull(resp.Data);
        Assert.IsNotNull(resp.Data.Result);
    }

    [Test]
    public async Task TestBuildByBuildIdWithInvalidMode()
    {
        MockedHandler.Clear();
        var base64EncodedAuthenticationString =
            Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_username}:{_accessKey}"));
        MockedHandler
            .Expect(HttpMethod.Post, "https://api.staging.saucelabs.net/v1/visual/*")
            .WithHeaders($"Authorization: Basic {base64EncodedAuthenticationString}")
            .WithPartialContent($"\"operationName\":\"{BuildQuery.OperationName}\"")
            .Respond("application/json", "{\"data\":{\"result\":{\"id\":\"buildId\",\"url\": \"https://app.staging.saucelabs.net/visual/builds/fd54fb6f-83b7-4c0b-af8d-da2b191c0a3b\",\"name\":\"dummy-build\",\"mode\":\"COMPLETED\"}}}");
        var resp = await Api.Build("buildId");
        Assert.IsNotNull(resp.Data);
        Assert.IsNotNull(resp.Data.Result);
    }
}