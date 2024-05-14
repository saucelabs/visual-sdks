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

        public static VisualCheckDiffingOptions EnableOnly(DiffingOption flags)
        {
            return new VisualCheckDiffingOptions(DiffingOptionMode.EnableOnly, flags);
        }

        public static VisualCheckDiffingOptions DisableOnly(DiffingOption flags)
        {
            return new VisualCheckDiffingOptions(DiffingOptionMode.DisableOnly, flags);
        }

        internal DiffingOptionsIn ToDiffingOptionsIn()
        {
            DiffingOptionsIn options;
            if (_mode == DiffingOptionMode.EnableOnly)
            {
                options = new DiffingOptionsIn(false);
                options = DiffingOptionsInHelper.SetOptions(options, _flags, true);
            }
            else
            {
                options = new DiffingOptionsIn(true);
                options = DiffingOptionsInHelper.SetOptions(options, _flags, false);
                return options;
            }
            return options;
        }
    }
}