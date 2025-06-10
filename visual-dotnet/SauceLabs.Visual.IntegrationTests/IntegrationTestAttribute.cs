using System;
using NUnit.Framework;
using NUnit.Framework.Interfaces;
using NUnit.Framework.Internal;

namespace SauceLabs.Visual.IntegrationTests;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, Inherited = false)]
public class IntegrationTestAttribute : NUnitAttribute, IApplyToTest
{
    /// <summary>
    /// In some cases, such as passing custom ID when the build does not exist, we only can run a single test class.
    /// This is a limitation of the `VisualClient` SDK, which closes a build with or without a custom ID 
    /// if it was created by the SDK.
    /// </summary>
    public bool SkipIfSingle { get; }

    public IntegrationTestAttribute()
    {
        SkipIfSingle = false;
    }

    public IntegrationTestAttribute(bool skipIfSingle)
    {
        SkipIfSingle = skipIfSingle;
    }

    public void ApplyToTest(Test test)
    {
        if (test.RunState == RunState.NotRunnable)
        {
            return;
        }

        if (Environment.GetEnvironmentVariable("RUN_IT") != "true")
        {
            test.RunState = RunState.Ignored;
            test.Properties.Set(PropertyNames.SkipReason, "This test runs only when RUN_IT is \"true\"");
        }

        if (SkipIfSingle && Environment.GetEnvironmentVariable("RUN_IT_SINGLE") == "true")
        {
            test.RunState = RunState.Ignored;
            test.Properties.Set(PropertyNames.SkipReason, "This test runs only when RUN_IT_SINGLE is NOT \"true\"");
        }
    }
}
