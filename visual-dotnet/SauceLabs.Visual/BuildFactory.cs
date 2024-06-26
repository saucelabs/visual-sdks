using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual
{
    internal static class BuildFactory
    {
        private static readonly Dictionary<string, ApiBuildPair> Builds = new Dictionary<string, ApiBuildPair>();

        /// <summary>
        /// <c>Get</c> returns the build matching with the requested region.
        /// If none is available, it returns a newly created build with <c>options</c>.
        /// It will also clone the input <c>api</c> to be able to close the build later.
        /// </summary>
        /// <param name="api">the api to use to create build</param>
        /// <param name="options">the options to use when creating the build</param>
        /// <returns></returns>
        internal static async Task<VisualBuild> Get(VisualApi api, CreateBuildOptions options)
        {
            // Check if there is already a build for the current region.
            if (Builds.TryGetValue(api.Region.Name, out var build))
            {
                return build.Build;
            }

            var createdBuild = await Create(api, options);
            Builds[api.Region.Name] = new ApiBuildPair(api.Clone(), createdBuild);
            return createdBuild;
        }

        /// <summary>
        /// <c>FindRegionByBuild</c> returns the region matching the passed build.
        /// </summary>
        /// <param name="build"></param>
        /// <returns>the matching region name</returns>
        private static string? FindRegionByBuild(VisualBuild build)
        {
            return Builds.Where(n => n.Value.Build == build).Select(n => n.Key).FirstOrDefault();
        }

        /// <summary>
        /// <c>Close</c> finishes and forget about <c>build</c>
        /// </summary>
        /// <param name="build">the build to finish</param>
        internal static async Task Close(VisualBuild build)
        {
            var key = FindRegionByBuild(build);
            if (key != null)
            {
                await Close(key, Builds[key]);
            }
        }

        /// <summary>
        /// <c>Close</c> finishes and forget about <c>build</c>
        /// </summary>
        /// <param name="region">the build to finish</param>
        /// <param name="entry">the api/build pair</param>
        private static async Task Close(string region, ApiBuildPair entry)
        {
            if (!entry.Build.IsExternal)
            {
                await entry.Api.FinishBuild(entry.Build.Id);
            }
            Builds.Remove(region);
            entry.Api.Dispose();
        }

        /// <summary>
        /// <c>CloseBuilds</c> closes all build that are still open.
        /// </summary>
        internal static async Task CloseBuilds()
        {
            var regions = Builds.Keys;
            foreach (var region in regions)
            {
                await Close(region, Builds[region]);
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