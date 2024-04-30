using System;
using System.Collections.Generic;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Models;

namespace SauceLabs.Visual.Utils
{
    public class DiffingOptionsBuilder
    {
        static readonly Dictionary<DiffingOption, Func<DiffingOptionsIn, bool, DiffingOptionsIn>> mapping = new Dictionary<DiffingOption, Func<DiffingOptionsIn, bool, DiffingOptionsIn>>()
        {
            { DiffingOption.Content, (diffingOptions, b) => {
                diffingOptions.Content = b;
                return diffingOptions;
            } },
            { DiffingOption.Dimensions, (diffingOptions, b) => {
                diffingOptions.Dimensions = b;
                return diffingOptions;
            } },
            { DiffingOption.Position, (diffingOptions, b) => {
                diffingOptions.Position = b;
                return diffingOptions;
            } },
            { DiffingOption.Structure, (diffingOptions, b) => {
                diffingOptions.Structure = b;
                return diffingOptions;
            } },
            { DiffingOption.Style, (diffingOptions, b) => {
                diffingOptions.Style = b;
                return diffingOptions;
            } },
            { DiffingOption.Visual, (diffingOptions, b) => {
                diffingOptions.Visual = b;
                return diffingOptions;
            } },
        };
        internal static DiffingOptionsIn? SelectiveRegionToDiffingOptions(DiffingOption[]? enableOnly, DiffingOption[]? disable)
        {
            if (enableOnly != null)
            {
                var options = new DiffingOptionsIn(false);
                foreach (var opt in enableOnly)
                {
                    if (mapping.TryGetValue(opt, out var fn))
                    {
                        options = fn(options, true);
                    }
                }
                return options;
            }

            if (disable != null)
            {
                var options = new DiffingOptionsIn(true);
                foreach (var opt in disable)
                {
                    if (mapping.TryGetValue(opt, out var fn))
                    {
                        options = fn(options, false);
                    }
                }
            }

            return null;
        }
    }
}