using System;

namespace SauceLabs.Visual.Models
{
    [Flags]
    public enum DiffingOption
    {
        None = 0,
        Content = 1 << 0,
        Dimensions = 1 << 1,
        Position = 1 << 2,
        Structure = 1 << 3,
        Style = 1 << 4,
        Visual = 1 << 5,
    }
}