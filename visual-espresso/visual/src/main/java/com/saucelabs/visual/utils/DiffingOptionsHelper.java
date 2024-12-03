package com.saucelabs.visual.utils;

import com.saucelabs.visual.graphql.type.DiffingOptionsIn;
import com.saucelabs.visual.model.DiffingOption;

import java.util.EnumSet;

public class DiffingOptionsHelper {

    public static DiffingOptionsIn toDiffingOptionsIn(EnumSet<DiffingOption> enable, EnumSet<DiffingOption> disable) {
        DiffingOptionsIn.Builder builder = DiffingOptionsIn.builder();
        if (enable != null) {
            builder = getBuilderWithDefault(builder, false);
            for (DiffingOption option : enable) {
                option.apply(builder, true);
            }
        }
        if (disable != null) {
            builder = getBuilderWithDefault(builder, true);
            for (DiffingOption option : disable) {
                option.apply(builder, false);
            }
        }
        return builder.build();
    }

    public static DiffingOptionsIn.Builder getBuilderWithDefault(DiffingOptionsIn.Builder builder, boolean value) {
        return builder
                .content(value)
                .dimensions(value)
                .position(value)
                .structure(value)
                .style(value)
                .visual(value);
    }
}
