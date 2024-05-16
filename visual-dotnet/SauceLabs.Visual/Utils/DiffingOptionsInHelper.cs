using System;
using System.Collections.Generic;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Models;

namespace SauceLabs.Visual.Utils
{
    public static class DiffingOptionsInHelper
    {
        internal static DiffingOptionsIn SetOptions(DiffingOptionsIn opts, DiffingOption flags, bool value)
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