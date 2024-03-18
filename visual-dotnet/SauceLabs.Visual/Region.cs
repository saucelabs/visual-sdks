using System;

namespace SauceLabs.Visual
{
    /// <summary>
    /// Class <c>Region</c> represents a Sauce Labs Region.
    /// It is used to specify where the <c>VisualClient</c> should connect to.
    /// </summary>
    public class Region
    {
        private Region(Uri value)
        {
            Value = value;
        }

        private Region(string value)
        {
            Value = new Uri(value);
        }

        public Uri Value { get; }

        public override string ToString()
        {
            return Value.ToString();
        }

        /// <summary>
        /// <c>FromName</c> returns the <c>Region</c> instance corresponding to <c>name</c>.
        /// </summary>
        /// <param name="name">the name of the region</param>
        /// <returns>the matching <c>Region</c> instance</returns>
        /// <exception cref="VisualClientException"></exception>
        public static Region FromName(string name)
        {
            return name switch
            {
                "us-west-1" => UsWest1,
                "us-east-4" => UsEast4,
                "eu-central-1" => EuCentral1,
                "staging" => Staging,
                _ => throw new VisualClientException($"Unknown region {name}")
            };
        }

        public static Region UsWest1 => new Region("https://api.us-west-1.saucelabs.com/v1/visual/graphql");
        public static Region UsEast4 => new Region("https://api.us-east-4.saucelabs.com/v1/visual/graphql");
        public static Region EuCentral1 => new Region("https://api.eu-central-1.saucelabs.com/v1/visual/graphql");
        public static Region Staging => new Region("https://api.staging.saucelabs.net/v1/visual/graphql");
    }
}