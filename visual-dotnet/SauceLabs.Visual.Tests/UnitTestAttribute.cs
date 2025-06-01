using System;
using NUnit.Framework;

namespace SauceLabs.Visual.Tests;

/// <summary>
/// Marks a test as a unit test.
/// These tests can be included using NUnit's command-line options:
/// - To run only unit tests: --filter "Category=Unit"
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false, Inherited = true)]
public class UnitTestAttribute : CategoryAttribute
{
    public UnitTestAttribute() : base("Unit")
    {
    }
}