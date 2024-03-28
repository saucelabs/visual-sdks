using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using NUnit.Framework;
using RichardSzalay.MockHttp;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Models;

namespace SauceLabs.Visual.Tests;

public class BuildFactoryTest
{
    MockHttpMessageHandler MockedHandler;
    private const string _username = "dummy-username";
    private const string _accessKey = "dummy-key";

    [SetUp]
    public void Setup()
    {
        MockedHandler = new MockHttpMessageHandler();

        var createHandler = () =>
        {
            var id = RandomString(32);
            var content = new VisualBuild(id, $"http://dummy/test/{id}", BuildMode.Running);
            var resp = new HttpResponseMessage(HttpStatusCode.OK);
            resp.Content = new ReadOnlyMemoryContent(ToResult(content));
            resp.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            return Task.FromResult(resp);
        };

        var base64EncodedAuthenticationString =
            Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_username}:{_accessKey}"));
        var regions = new[] { Region.Staging, Region.UsEast4, Region.EuCentral1, Region.UsWest1 };
        foreach (var r in regions)
        {
            MockedHandler
                .When(r.Value.ToString())
                .WithHeaders($"Authorization: Basic {base64EncodedAuthenticationString}")
                .WithPartialContent($"\"operationName\":\"{CreateBuildMutation.OperationName}\"")
                .Respond(createHandler);
            MockedHandler
                .When(r.Value.ToString())
                .WithHeaders($"Authorization: Basic {base64EncodedAuthenticationString}")
                .WithPartialContent($"\"operationName\":\"{FinishBuildMutation.OperationName}\"")
                .Respond(createHandler);
        }
        MockedHandler.Fallback.Throw(new InvalidOperationException("No matching mock handler"));
    }

    [TearDown]
    public void Cleanup()
    {
        MockedHandler.Dispose();
    }

    private string RandomString(int length)
    {
        const string chars = "abcdef0123456789";
        return new string(Enumerable.Repeat(chars, length).Select(s => s[Random.Shared.Next(s.Length)]).ToArray());
    }

    private byte[] ToResult(object o)
    {
        var nestedContent = new
        {
            Data = new
            {
                Result = o
            },
        };
        return Encoding.ASCII.GetBytes(JsonConvert.SerializeObject(nestedContent));
    }

    [Test]
    public async Task BuildFactory_ReturnSameBuildWhenSameRegion()
    {
        var api = new VisualApi(Region.Staging, _username, _accessKey, MockedHandler.ToHttpClient());
        var build1 = await BuildFactory.Get(api, new CreateBuildOptions());
        var build2 = await BuildFactory.Get(api, new CreateBuildOptions());
        Assert.AreEqual(build1, build2);
    }

    [Test]
    public async Task BuildFactory_ReturnDifferentBuildWhenDifferentRegion()
    {
        var api1 = new VisualApi(Region.Staging, _username, _accessKey, MockedHandler.ToHttpClient());
        var api2 = new VisualApi(Region.UsEast4, _username, _accessKey, MockedHandler.ToHttpClient());
        var build1 = await BuildFactory.Get(api1, new CreateBuildOptions());
        var build2 = await BuildFactory.Get(api2, new CreateBuildOptions());
        Assert.AreNotEqual(build1, build2);
    }
}