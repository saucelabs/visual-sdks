# Unit Tests

This project contains unit tests for the Sauce Labs Visual C# SDK. These tests are marked with the `[UnitTest]` attribute.

## Why Mark Unit Tests?

We've chosen to explicitly mark unit tests (rather than marking integration tests) because:

1. It's more direct and explicit about what tests are being run
2. It follows the principle of being explicit rather than implicit
3. It prevents uncategorized tests from running when they shouldn't
4. It makes it clear which tests are safe to run in any environment

## Running Tests

### Command Line

You can control which tests to run using NUnit's command-line options:

#### Run All Tests
```
dotnet test
```

#### Run Only Unit Tests
```
dotnet test --filter "Category=Unit"
```

### Visual Studio / Rider

You can use the Test Explorer to filter tests by category:
1. Open the Test Explorer
2. Click on the filter icon
3. Select "Category" and choose "Unit" to run only unit tests

## How It Works

The `[UnitTest]` attribute is a custom attribute that inherits from NUnit's `CategoryAttribute`. This allows us to use NUnit's built-in filtering capabilities to include only unit tests.

```csharp
[UnitTest]
[Test]
public void MyUnitTest()
{
    // Test code
}
```

You can also apply the attribute to a class to mark all tests in that class as unit tests:

```csharp
[UnitTest]
public class UnitTests
{
    [Test]
    public void Test1() { }

    [Test]
    public void Test2() { }
}
```