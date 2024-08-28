namespace SauceLabs.Visual
{

    /// <summary>
    /// <c>CreateBuildOptions</c> represents the options that can be used when creating a Visual build.
    /// </summary>
    public class CreateBuildOptions
    {
        public string? Name { get; set; }
        public string? Project { get; set; }
        public string? Branch { get; set; }
        public string? CustomId { get; set; }
        public string? DefaultBranch { get; set; }
    }
}