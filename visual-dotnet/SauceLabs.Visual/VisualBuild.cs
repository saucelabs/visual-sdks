using System;
using System.Threading.Tasks;
using SauceLabs.Visual.Models;

namespace SauceLabs.Visual
{
    /// <summary>
    /// <c>VisualBuild</c> represents a Sauce Labs Visual build.
    /// </summary>
    public class VisualBuild
    {
        public string Id { get; internal set; }
        public string Url { get; internal set; }

        public BuildMode Mode { get; internal set; }

        /// <summary>
        /// <c>IsExternal</c> represents if the build lifecycle is managed outside of the current context.
        /// </summary>
        internal bool IsExternal { get; set; } = false;

        internal VisualBuild(string id, string url, BuildMode mode)
        {
            Id = id;
            Url = url;
            Mode = mode;
        }

        internal bool IsRunning() => Mode == BuildMode.Running;
    }
}