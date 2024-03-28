namespace SauceLabs.Visual
{
    public class ApiBuildPair
    {
        internal VisualBuild Build { get; }
        internal VisualApi Api { get; }

        internal ApiBuildPair(VisualApi api, VisualBuild build)
        {
            Build = build;
            Api = api;
        }
    }
}