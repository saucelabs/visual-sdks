# Sauce Labs Visual for Java

Sauce Labs Visual for Java exposes Sauce Labs Visual Testing for your Java project with Selenium.

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

- Instantiate `VisualApi` object
  ```java
  
  import com.saucelabs.visual.DataCenter;
  import com.saucelabs.visual.VisualApi;
  import org.openqa.selenium.remote.RemoteWebDriver;
  //...
  RemoteWebDriver driver = new RemoteWebDriver(webDriverUrl, capabilities);
  VisualApi visual = new VisualApi.Builder(driver, sauceUsername, sauceAccessKey, DataCenter.US_WEST_1).build();
  ```

- Invoke Visual Testing
  ```java
  
  import com.saucelabs.visual.CheckOptions;   
  //...
  CheckOptions checkOptions = new CheckOptions.Builder().withCaptureDom(true).build();
  visual.sauceVisualCheck("Home Page", checkOptions);
  ```

- Get results of Visual Tests and run assertions on it
  ```java
  
  import com.saucelabs.visual.graphql.type.DiffStatus;
  import org.junit.jupiter.api.Assertions;
  //...
  Map<DiffStatus, Integer> results = visual.sauceVisualResults();
  // verify that no differences have been detected
  Assertions.assertEquals(0, results.get(DiffStatus.APPROVED));
  ```
