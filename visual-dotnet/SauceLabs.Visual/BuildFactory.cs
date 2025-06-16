using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual
{
    /// <summary>
    /// Factory for creating and managing Visual builds.
    /// This class is thread-safe and supports parallel execution.
    /// </summary>
    internal static class BuildFactory
    {

        private static readonly ConcurrentDictionary<BuildKey, Lazy<Task<ApiBuildPair>>> Builds =
            new ConcurrentDictionary<BuildKey, Lazy<Task<ApiBuildPair>>>();

        /// <summary>
        /// <c>Get</c> returns the build matching with the requested region or name.
        /// If none is available, it returns a newly created build with <c>options</c>.
        /// It will also clone the input <c>api</c> to be able to close the build later.
        /// This method is thread-safe and ensures only one build is created when called concurrently with the same key.
        /// </summary>
        /// <param name="api">the api to use to create build</param>
        /// <param name="options">the options to use when creating the build</param>
        /// <returns>A VisualBuild instance</returns>
        internal static async Task<VisualBuild> Get(VisualApi api, CreateBuildOptions options)
        {
            BuildKey buildKey;
            if (!string.IsNullOrEmpty(options.Name))
            {
                buildKey = BuildKey.OfBuildName(options.Name);
            }
            else
            {
                buildKey = BuildKey.OfRegion(api.Region);
            }

            var lazyBuild = Builds.GetOrAdd(buildKey, key => new Lazy<Task<ApiBuildPair>>(async () =>
            {
                var createdBuild = await Create(api, options);
                return new ApiBuildPair(api.Clone(), createdBuild);
            }));

            ApiBuildPair storedBuildPair = await lazyBuild.Value;
            return storedBuildPair.Build;
        }

        /// <summary>
        /// <c>FindBuildKey</c> returns the key (build name or region) matching the passed build.
        /// </summary>
        /// <param name="build"></param>
        /// <returns>the matching build key</returns>
        private static BuildKey? FindBuildKey(VisualBuild build)
        {
            return Builds.Where(n => n.Value.IsValueCreated && n.Value.Value.IsCompleted && n.Value.Value.Result.Build == build)
                .Select(n => n.Key)
                .FirstOrDefault();
        }

        /// <summary>
        /// <c>Close</c> finishes and removes the specified build from the cache.
        /// This method is thread-safe and can be called from multiple threads.
        /// </summary>
        /// <param name="build">the build to finish</param>
        internal static async Task Close(VisualBuild build)
        {
            var key = FindBuildKey(build);
            if (key != null && Builds.TryGetValue(key, out var lazyBuildPair) && lazyBuildPair.IsValueCreated)
            {
                var buildPair = await lazyBuildPair.Value;
                await Close(key, buildPair);
            }
        }

        /// <summary>
        /// <c>Close</c> finishes and removes the build from the cache.
        /// </summary>
        /// <param name="buildKey">the build key (name or region) to finish</param>
        /// <param name="entry">the api/build pair</param>
        private static async Task Close(BuildKey buildKey, ApiBuildPair entry)
        {
            if (!entry.Build.IsExternal)
            {
                await entry.Api.FinishBuild(entry.Build.Id);
            }

            Builds.TryRemove(buildKey, out _);
            entry.Api.Dispose();
        }

        /// <summary>
        /// <c>CloseBuilds</c> closes all builds that are still open.
        /// This method is thread-safe and should be called during application shutdown.
        /// </summary>
        internal static async Task CloseBuilds()
        {
            var buildsToClose = Builds.ToArray();
            foreach (var kvp in buildsToClose)
            {
                if (kvp.Value.IsValueCreated && kvp.Value.Value.IsCompleted)
                {
                    var buildPair = await kvp.Value.Value;
                    await Close(kvp.Key, buildPair);
                }
            }
        }

        /// <summary>
        /// <c>FindBuildById</c> returns the build identified by <c>buildId</c>
        /// </summary>
        /// <param name="api">a <c>VisualApi</c> object</param>
        /// <param name="buildId">the <c>buildId</c> to look for</param>
        /// <returns>the matching build</returns>
        /// <exception cref="VisualClientException">when build is not existing or has an invalid state</exception>
        private static async Task<VisualBuild> FindBuildById(VisualApi api, string buildId)
        {
            try
            {
                var build = (await api.Build(buildId)).EnsureValidResponse().Result;
                if (build == null)
                {
                    throw new VisualClientException($@"build {buildId} was not found");
                }

                return new VisualBuild(build.Id, build.Url, build.Mode);
            }
            catch (VisualClientException)
            {
                throw new VisualClientException($@"build {buildId} was not found");
            }
        }

        /// <summary>
        /// <c>FindBuildById</c> returns the build identified by <c>buildId</c>
        /// </summary>
        /// <param name="api">a <c>VisualApi</c> object</param>
        /// <param name="customId">the <c>customId</c> to look for</param>
        /// <returns>the matching build</returns>
        /// <exception cref="VisualClientException">when build is not existing or has an invalid state</exception>
        private static async Task<VisualBuild?> FindBuildByCustomId(VisualApi api, string customId)
        {
            try
            {
                var build = (await api.BuildByCustomId(customId)).EnsureValidResponse().Result;
                if (build == null)
                {
                    throw new VisualClientException($@"build identified by {customId} was not found");
                }

                return new VisualBuild(build.Id, build.Url, build.Mode);
            }
            catch (VisualClientException)
            {
                return null;
            }
        }

        /// <summary>
        /// <c>CreateBuild</c> creates a new Visual build.
        /// </summary>
        /// <param name="api">the api client used for the build creation</param>
        /// <param name="options">the options for the build creation</param>
        /// <returns>a <c>VisualBuild</c> instance</returns>
        private static async Task<VisualBuild> Create(VisualApi api, CreateBuildOptions options)
        {
            var build = await GetEffectiveBuild(api, EnvVars.BuildId, EnvVars.CustomId);
            if (build != null)
            {
                if (!build.IsRunning())
                {
                    throw new VisualClientException($"build {build.Id} is not RUNNING");
                }

                build.IsExternal = true;
                return build;
            }

            options.CustomId ??= EnvVars.CustomId;
            var result = (await api.CreateBuild(new CreateBuildIn
            {
                Name = StringUtils.ValueOrDefault(options.Name, EnvVars.BuildName),
                Project = StringUtils.ValueOrDefault(options.Project, EnvVars.Project),
                Branch = StringUtils.ValueOrDefault(options.Branch, EnvVars.Branch),
                DefaultBranch = StringUtils.ValueOrDefault(options.DefaultBranch, EnvVars.DefaultBranch),
                CustomId = options.CustomId,
            })).EnsureValidResponse();

            build = new VisualBuild(result.Result.Id, result.Result.Url, result.Result.Mode)
            {
                IsExternal = false
            };
            return build;
        }

        /// <summary>
        /// <c>GetEffectiveBuild</c> tries to find the build matching the criterion provided by the user.
        /// </summary>
        /// <param name="api"></param>
        /// <param name="buildId"></param>
        /// <param name="customId"></param>
        /// <returns></returns>
        private static async Task<VisualBuild?> GetEffectiveBuild(VisualApi api, string? buildId, string? customId)
        {
            if (!StringUtils.IsNullOrEmpty(buildId))
            {
                return await FindBuildById(api, buildId!.Trim());
            }

            if (!StringUtils.IsNullOrEmpty(customId))
            {
                return await FindBuildByCustomId(api, customId!.Trim());
            }
            return null;
        }
    }
}
