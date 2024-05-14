using System.Diagnostics;
using System.Linq;
using OpenQA.Selenium;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Models;
using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual
{
    public class VisualCheckDiffingOptions
    {
        private enum DiffingOptionMode
        {
            EnableOnly,
            DisableOnly
        }

        private readonly DiffingOptionMode _mode;
        private readonly DiffingOption _flags;

        private VisualCheckDiffingOptions(DiffingOptionMode mode, DiffingOption flags)
        {
            _mode = mode;
            _flags = flags;
        }

        /// <summary>
        /// <c>EnableOnly</c> sets which change types to check for.
        /// Only <c>BALANCED</c> engine is compatible.
        /// </summary>
        public static VisualCheckDiffingOptions EnableOnly(DiffingOption flags)
        {
            return new VisualCheckDiffingOptions(DiffingOptionMode.EnableOnly, flags);
        }

        /// <summary>
        /// <c>DisableOnly</c> sets which change types to ignore.
        /// Only <c>BALANCED</c> engine is compatible.
        /// </summary>
        public static VisualCheckDiffingOptions DisableOnly(DiffingOption flags)
        {
            return new VisualCheckDiffingOptions(DiffingOptionMode.DisableOnly, flags);
        }

        internal DiffingOptionsIn ToDiffingOptionsIn()
        {
            DiffingOptionsIn options;
            if (_mode == DiffingOptionMode.EnableOnly)
            {
                options = DiffingOptionsInHelper.SetOptions(new DiffingOptionsIn(false), _flags, true);
            }
            else
            {
                options = DiffingOptionsInHelper.SetOptions(new DiffingOptionsIn(true), _flags, false);
            }
            return options;
        }
    }
}