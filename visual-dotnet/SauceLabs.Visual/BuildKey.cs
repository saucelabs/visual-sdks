using RegionModel = SauceLabs.Visual.Region;

namespace SauceLabs.Visual
{
    internal class BuildKey
    {
        public static Region OfRegion(RegionModel region)
        {
            return new Region(region);
        }

        public static BuildName OfBuildName(string buildName)
        {
            return new BuildName(buildName);
        }

        public class Region : BuildKey
        {
            public RegionModel Value { get; }

            public Region(RegionModel region)
            {
                Value = region;
            }

            public override bool Equals(object obj)
            {
                return obj switch
                {
                    Region key => key.Value.Equals(Value),
                    _ => false
                };
            }

            public override int GetHashCode()
            {
                return Value.GetHashCode();
            }
        }

        public class BuildName : BuildKey
        {
            public string Value { get; }

            public BuildName(string buildName)
            {
                Value = buildName;
            }

            public override bool Equals(object obj)
            {
                return obj switch
                {
                    BuildName key => key.Value.Equals(Value),
                    _ => false
                };
            }

            public override int GetHashCode()
            {
                return Value.GetHashCode();
            }
        }
    }
}

