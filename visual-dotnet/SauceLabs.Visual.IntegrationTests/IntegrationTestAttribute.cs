using System;
using NUnit.Framework;
using NUnit.Framework.Interfaces;
using NUnit.Framework.Internal;

namespace SauceLabs.Visual.IntegrationTests;

[AttributeUsage(AttributeTargets.Method, Inherited = false)]
public class IntegrationTestAttribute : NUnitAttribute, IApplyToTest
{
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
    }
}