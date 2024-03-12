namespace SauceLabs.Visual
{
    /// <summary>
    /// <c>VisualBuild</c> represents a Sauce Labs Visual build.
    /// </summary>
    public class VisualBuild
    {
        public string Id { get; internal set; }
        public string Url { get; internal set; }

        internal VisualBuild(string id, string url)
        {
            Id = id;
            Url = url;
        }
    }
}