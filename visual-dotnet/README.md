# Sauce Labs Visual for C#

Sauce Labs Visual for C# expose Sauce Labs Visual Testing for your C# project with Selenium.

# Installation

Add SauceLabs.Visual to your current project
```sh
dotnet add package SauceLabs.Visual
```

# How to use

- Instantiate `VisualClient` object
  ```csharp
  var dataCenter = DataCenter.UsWest1;
  var visualClient = await VisualClient.Create(Driver, datacenter);
  ```

- Invoke Visual Testing
  ```csharp
  var checkOptions = new VisualCheckOptions() { CaptureDom = true };
  await visualClient.VisualCheck("Home Page", checkOptions);
  ```

- Get results of Visual Tests and run assertions on it
  ```csharp
  var results = await visualClient.VisualResults(visualBuild.Id);
  // verify that no differences have been detected
  Assert.AreEqual(0, results[DiffStatus.Approved]);
  ```
