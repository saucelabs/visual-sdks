using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual
{
    internal static class BuildFactory
    {
        private static readonly Dictionary<string, VisualBuild> _builds = new Dictionary<string, VisualBuild>();

        internal static async Task<VisualBuild> Get(VisualClient client, CreateBuildOptions options)
        {
            // Check if there is already a build for the current region.
            if (_builds.TryGetValue(client.Api.Region.Name, out var build))
            {
                return build;
            }

            var createdBuild = await Create(client, options);
            _builds[client.Api.Region.Name] = createdBuild;
            return createdBuild;
        }

        private static void Disregard(VisualBuild build)
        {
            string? key = null;
            var enumerator = _builds.GetEnumerator();
            while (enumerator.MoveNext())
            {
                if (enumerator.Current.Value != build)
                {
                    continue;
                }
                key = enumerator.Current.Key;
                break;
            }
            enumerator.Dispose();

            if (key != null)
            {
                _builds.Remove(key);
            }
        }

        public static async Task CloseBuilds()
        {
            var builds = _builds.Values.ToArray();
            foreach (var build in builds)
            {
                if (build.Close != null)
                {
                    await build.Close();
                }
            }
        }

        /// <summary>
        /// <c>CreateBuild</c> creates a new Visual build.
        /// </summary>
        /// <param name="client">the client used for the build creation</param>
        /// <param name="options">the options for the build creation</param>
        /// <returns>a <c>VisualBuild</c> instance</returns>
        private static async Task<VisualBuild> Create(VisualClient client, CreateBuildOptions options)
        {
            var build = await GetEffectiveBuild(client, EnvVars.BuildId, EnvVars.CustomId);
            if (build != null)
            {
                if (!build.IsRunning())
                {
                    throw new VisualClientException($"build {build.Id} is not RUNNING");
                }

                build.IsExternal = true;
                build.Close = async () => Disregard(build);
                return build;
            }

            options.CustomId ??= EnvVars.CustomId;
            var result = (await client.Api.CreateBuild(new CreateBuildIn
            {
                Name = options.Name,
                Project = options.Project,
                Branch = options.Branch,
                CustomId = options.CustomId,
                DefaultBranch = options.DefaultBranch,
            })).EnsureValidResponse();

            build = new VisualBuild(result.Result.Id, result.Result.Url, result.Result.Mode)
            {
                IsExternal = false,
            };

            var copiedApi = client.Api.Clone();
            build.Close = async () =>
            {
                await copiedApi.FinishBuild(build.Id);
                Disregard(build);
            };
            return build;
        }

        private static async Task<VisualBuild?> GetEffectiveBuild(VisualClient client, string? buildId, string? customId)
        {
            if (!StringUtils.IsNullOrEmpty(buildId))
            {
                return await client.FindBuildById(buildId!.Trim());
            }

            if (!StringUtils.IsNullOrEmpty(customId))
            {
                return await client.FindBuildByCustomId(customId!.Trim());
            }
            return null;
        }
    }
}