using NUnit.Framework;
using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual.Tests.Utils;

public class OptionTest
{
    [Test]
    public void Option_Some_HasValue_ShouldBeTrue()
    {
        var option = Option.Some("abc");
        Assert.IsTrue(option.HasValue);
    }
    [Test]
    public void Option_Some_HasValue_ShouldBeTrueWithNull()
    {
        var option = Option.Some<string?>(null);
        Assert.IsTrue(option.HasValue);
    }

    [Test]
    public void Option_None_HasValue_ShouldBeFalse()
    {
        var option = Option.None<string>();
        Assert.IsFalse(option.HasValue);
    }

    [Test]
    public void Option_Default_HasValue_ShouldBeFalse()
    {
        Option<string> option = default;
        Assert.IsFalse(option.HasValue);
    }

    [Test]
    public void Option_Some_Value_ShouldEqualToValue()
    {
        var option = Option.Some("abc");
        Assert.AreEqual(option.Value, "abc");
    }

    [Test]
    public void Option_None_Value_ShouldBeDefault()
    {
        var option = Option.None<string>();
        Assert.AreEqual(option.Value, default);
    }

    [Test]
    public void Option_Some_ImplicitSet_ShouldSetValue()
    {
        Option<string> option = "abc";
        Assert.AreEqual(option.Value, "abc");
    }

    [Test]
    public void Option_Some_ImplicitSet_ShouldSetValueToNull()
    {
        Option<string?> option = null;
        Assert.AreEqual(option.Value, null);
    }

    [Test]
    public void Option_Some_ImplicitGet_ShouldGetValue()
    {
        Option<string> option = "abc";
        string value = option;
        Assert.AreEqual(value, "abc");
    }

    [Test]
    public void Option_None_ImplicitGet_ShouldGetValue()
    {
        var option = Option.None<string?>();
        string? value = option;
        Assert.AreEqual(value, default);
    }
}
