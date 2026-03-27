package com.saucelabs.visual.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.graphql_java_generator.annotation.GraphQLScalar;
import com.saucelabs.visual.graphql.type.BaselineOverrideIn;
import com.saucelabs.visual.graphql.type.Browser;
import com.saucelabs.visual.graphql.type.OperatingSystem;

import java.util.Optional;

/**
 * Helper class for serializing optional values (undefined (omitted), null, and Value) into
 * GraphQL schema. Internal use only. Extends the default BaselineOverrideIn so we can use it in
 * standard graphql requests / inputs as a subclass while handling serialization differently.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BaselineOverrideInput extends BaselineOverrideIn {

  @JsonProperty("browser")
  @GraphQLScalar( fieldName = "browser", graphQLTypeSimpleName = "Browser", javaClass = com.saucelabs.visual.graphql.type.Browser.class, listDepth = 0)
  private Optional<Browser> browser;

  @Override
  public void setBrowser(Browser browser) {
    this.browser = Optional.ofNullable(browser);
  }

  @Override
  @JsonIgnore
  public Browser getBrowser() {
    return this.browser.orElse(null);
  }

  public void setBrowser(Optional<Browser> browser){
    this.browser = browser;
  }

  @JsonProperty("browser")
  public Optional<Browser> browser(){
    return this.browser;
  }
}
