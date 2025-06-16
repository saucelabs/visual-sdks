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
using System.Collections.Generic;

namespace SauceLabs.Visual.Tests;

public class BuildFactoryParallelTest
{
    MockHttpMessageHandler MockedHandler;
    private const string _username = "dummy-username";
    private const string _accessKey = "dummy-key";
    private int _buildCounter = 0;

    [SetUp]
    public void Setup()
    {
        MockedHandler = new MockHttpMessageHandler();
        _buildCounter = 0;

        var createHandler = () =>
        {
            _buildCounter++;

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
    public async Task BuildFactory_CreateOnlyOneBuildWhenCalledInParallel()
    {
        var api = new VisualApi(Region.Staging, _username, _accessKey, MockedHandler.ToHttpClient());
        var options = new CreateBuildOptions { Name = "ParallelBuildTest" };
        const int parallelCalls = 6;

        var tasks = Enumerable.Range(0, parallelCalls)
            .Select(_ => BuildFactory.Get(api, options))
            .ToArray();

        var builds = await Task.WhenAll(tasks);

        var firstBuild = builds[0];
        Assert.That(builds, Is.All.EqualTo(firstBuild), "All builds should be the same instance");
        Assert.AreEqual(1, _buildCounter, "Only one build should have been created");
    }

    [Test]
    public async Task BuildFactory_CreateDifferentBuildsWhenCalledInParallelWithDifferentNames()
    {
        var api = new VisualApi(Region.Staging, _username, _accessKey, MockedHandler.ToHttpClient());
        const int parallelCalls = 3;

        var tasks = Enumerable.Range(0, parallelCalls)
            .Select(i => BuildFactory.Get(api, new CreateBuildOptions { Name = $"ParallelBuildTest-{i}" }))
            .ToArray();

        var builds = await Task.WhenAll(tasks);

        Assert.That(builds.Distinct().Count(), Is.EqualTo(builds.Length), "All builds should be different instances");
        Assert.AreEqual(parallelCalls, _buildCounter, $"Expected {parallelCalls} builds to be created");
    }
}