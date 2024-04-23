using System;
using System.Collections.Generic;

namespace SauceLabs.Visual.Models
{
    public class DiffingRegionOption
    {
        public bool Content { get; set; } = false;
        public bool Dimensions { get; set; } = false;
        public bool Position { get; set; } = false;
        public bool Structure { get; set; } = false;
        public bool Style { get; set; } = false;
        public bool Visual { get; set; } = false;

        public void Enable(DiffingOption opt) => SetOption(opt, true);
        public void Disable(DiffingOption opt) => SetOption(opt, false);

        internal void SetOption(DiffingOption opt, bool value)
        {
            var mapping = new Dictionary<DiffingOption, Func<bool, bool>>()
            {
                { DiffingOption.Content, b => Content = b },
                { DiffingOption.Dimensions, b => Dimensions = b },
                { DiffingOption.Position, b => Position = b },
                { DiffingOption.Structure, b => Structure = b },
                { DiffingOption.Style, b => Style = b },
                { DiffingOption.Visual, b => Visual = b },
            };
            if (mapping.TryGetValue(opt, out var fn))
            {
                fn(value);
            }
        }
    }
}