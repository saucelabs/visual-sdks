# Sauce Labs Visual for Java

Sauce Labs Visual for Java expose Sauce Labs Visual Testing for your Java project with Selenium.

## Installation

Add [sauce visual](https://central.sonatype.com/artifact/com.saucelabs.visual/java-client) dependency to your project

*Latest available version can be found [here](https://central.sonatype.com/artifact/com.saucelabs.visual/java-client)*

- Maven

```xml

<dependency>
  <groupId>com.saucelabs.visual</groupId>
  <artifactId>java-client</artifactId>
  <version>LATEST VERSION</version>
  <scope>test</scope>
</dependency>
```

- Gradle

```
testImplementation group: 'com.saucelabs.visual', name: 'java-client', version: 'LATEST VERSION'
```

- Gradle (short)

```
testImplementation 'com.saucelabs.visual:java-client:LATEST VERSION'
```

## How to use

- Instantiate `VisualClient` object
  ```java
  import com.saucelabs.visual.DataCenter;
  //...   
  DataCenter dataCenter = DataCenter.US_WEST_1;
  var visualClient = await VisualClient.Create(Driver, datacenter);
  ```

- Invoke Visual Testing
  ```java
  var checkOptions = new VisualCheckOptions() { CaptureDom = true };
  await visualClient.VisualCheck("Home Page", checkOptions);
  ```

- Get results of Visual Tests and run assertions on it
  ```java
  var results = await visualClient.VisualResults(visualBuild.Id);
  // verify that no differences have been detected
  Assert.AreEqual(0, results[DiffStatus.Approved]);
  ```
