package com.saucelabs.visual;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.saucelabs.visual.exception.VisualApiException;
import org.junit.jupiter.api.Test;

public class DataCenterTest {

  @Test
  void resolvesEveryRegionByName() {
    assertEquals(DataCenter.US_WEST_1, DataCenter.fromSauceRegion("us-west-1"));
    assertEquals(DataCenter.US_EAST_4, DataCenter.fromSauceRegion("us-east-4"));
    assertEquals(DataCenter.EU_CENTRAL_1, DataCenter.fromSauceRegion("eu-central-1"));
    assertEquals(DataCenter.ASIA_SOUTH_2, DataCenter.fromSauceRegion("asia-south-2"));
  }

  @Test
  void defaultsToUsWest1() {
    assertEquals(DataCenter.US_WEST_1, DataCenter.fromSauceRegion(null));
  }

  @Test
  void asiaSouth2UsesItsOwnEndpoint() {
    assertEquals(
        "https://api.asia-south-2.saucelabs.com/v1/visual/graphql",
        DataCenter.ASIA_SOUTH_2.endpoint);
  }

  @Test
  void rejectsUnknownRegions() {
    assertThrows(VisualApiException.class, () -> DataCenter.fromSauceRegion("mars-1"));
  }
}
