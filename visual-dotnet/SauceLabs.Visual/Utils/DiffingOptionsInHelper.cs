using System;
using System.Collections.Generic;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Models;

namespace SauceLabs.Visual.Utils
{
    public static class DiffingOptionsInHelper
    {
        private static readonly Dictionary<DiffingOption, Func<DiffingOptionsIn, bool, DiffingOptionsIn>> Mapping = new Dictionary<DiffingOption, Func<DiffingOptionsIn, bool, DiffingOptionsIn>>()
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

        private static DiffingOptionsIn SetOptions(DiffingOptionsIn opts, DiffingOption flags, bool value)
        {
            if (flags.HasFlag(DiffingOption.Content))
            {
                opts.Content = value;
            }

            if (flags.HasFlag(DiffingOption.Dimensions))
            {
                opts.Dimensions = value;
            }

            if (flags.HasFlag(DiffingOption.Position))
            {
                opts.Position = value;
            }

            if (flags.HasFlag(DiffingOption.Structure))
            {
                opts.Structure = value;
            }

            if (flags.HasFlag(DiffingOption.Style))
            {
                opts.Style = value;
            }

            if (flags.HasFlag(DiffingOption.Visual))
            {
                opts.Visual = value;
            }

            return opts;
        }

        internal static DiffingOptionsIn? CreateFromEnableOnlyDisable(DiffingOption? enableOnly, DiffingOption? disableOnly)
        {
            if (enableOnly.HasValue)
            {
                var options = new DiffingOptionsIn(false);
                options = SetOptions(options, enableOnly.Value, true);
                return options;
            }

            if (disableOnly.HasValue)
            {
                var options = new DiffingOptionsIn(true);
                options = SetOptions(options, disableOnly.Value, false);
                return options;
            }

            return null;
        }
    }
}