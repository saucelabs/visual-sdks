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

        internal bool IsExternal { get; set; } = false;
        internal Func<Task>? Close;

        internal VisualBuild(string id, string url, BuildMode mode)
        {
            Id = id;
            Url = url;
            Mode = mode;
        }

        internal bool IsRunning() => Mode == BuildMode.Running;
    }
}