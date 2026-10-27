package com.saucelabs.visual;

import static org.junit.Assert.assertEquals;

import com.apollographql.apollo.api.Optional;
import com.saucelabs.visual.VisualBuild.BuildAttributes;
import com.saucelabs.visual.graphql.type.BuildIn;

import org.junit.Test;

import java.util.Arrays;
import java.util.List;

public class VisualApiTest {

    @Test
    public void buildInputSendsTags() {
        List<String> tags = Arrays.asList("smoke", "nightly");
        BuildIn input = VisualApi.buildInput(new BuildAttributes("Build", "Project", "feature", "main", tags));

        assertEquals(Optional.present(tags), input.tags);
        assertEquals(Optional.present("Build"), input.name);
    }

    @Test
    public void buildInputSendsNullTagsWhenThereAreNone() {
        BuildIn input = VisualApi.buildInput(new BuildAttributes("Build", "Project", "feature", "main"));

        assertEquals(Optional.present(null), input.tags);
    }
}
