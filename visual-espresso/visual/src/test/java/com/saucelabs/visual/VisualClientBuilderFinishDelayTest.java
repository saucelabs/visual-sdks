package com.saucelabs.visual;

import static org.junit.Assert.assertThrows;

import org.junit.Test;

public class VisualClientBuilderFinishDelayTest {

    private VisualClient.Builder builder() {
        return new VisualClient.Builder("u", "k");
    }

    // setter boundary values

    @Test
    public void buildFinishDelay_negativeValue_throwsIllegalArgumentException() {
        assertThrows(
                IllegalArgumentException.class,
                () -> builder().buildFinishDelay(-1));
    }

    @Test
    public void buildFinishDelay_nullIsAccepted() {
        builder().buildFinishDelay(null);
    }

    @Test
    public void buildFinishDelay_positiveValue_doesNotThrowAtSetter() {
        builder().buildFinishDelay(60);
    }

    // customId + finishDelay validation

    @Test
    public void validate_passesWithNeitherCustomIdNorFinishDelay() {
        builder().validate();
    }

    @Test
    public void validate_passesWithCustomIdOnly() {
        builder().customId("ci-run").validate();
    }

    @Test
    public void validate_passesWithCustomIdAndFinishDelay() {
        builder().customId("ci-run").buildFinishDelay(60).validate();
    }

    @Test
    public void validate_throwsWhenFinishDelaySetWithoutCustomId() {
        assertThrows(
                IllegalStateException.class,
                () -> builder().buildFinishDelay(60).validate());
    }

    @Test
    public void validate_throwsWhenFinishDelaySetWithBlankCustomId() {
        assertThrows(
                IllegalStateException.class,
                () -> builder().customId("   ").buildFinishDelay(60).validate());
    }
}
