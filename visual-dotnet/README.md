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
  var visualClient = new VisualClient(webDriver, dataCenter, "your-sauce-username", "your-sauce-access-key");
  ```

- Create a build
  ```csharp
  var buildOptions = new CreateBuildOptions() { Name = "My Visual Build" };
  var visualBuild = await visualClient.CreateBuild(buildOptions);
  ```

- Invoke Visual Testing
  ```csharp
  var checkOptions = new VisualCheckOptions() { CaptureDom = true };
  await visualClient.VisualCheck(visualBuild, "Home Page", checkOptions);
  ```

- Get results of Visual Tests and run assertions on it
  ```csharp
  var results = await visualClient.VisualResults(visualBuild.Id);
  // verify if any check is unapproved
  Assert.AreEqual(0, results[DiffStatus.Unapproved]);
  ```
