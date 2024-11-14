package com.saucelabs.visual.model;

/**
 * Denotes a Sauce Visual region that can be used as an ignore region
 */
public class Region {
    private final String name;
    private final Integer x;
    private final Integer y;
    private final Integer width;
    private final Integer height;

    public Region(String name, Integer x, Integer y, Integer width, Integer height) {
        this.name = name;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
    }

    public static class Builder {
        private String name;
        private Integer x;
        private Integer y;
        private Integer width;
        private Integer height;

        public Builder() {
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder x(Integer x) {
            this.x = x;
            return this;
        }

        public Builder y(Integer y) {
            this.y = y;
            return this;
        }

        public Builder width(Integer width) {
            this.width = width;
            return this;
        }

        public Builder height(Integer height) {
            this.height = height;
            return this;
        }

        public Region build() {
            return new Region(this.name, this.x, y, width, height);
        }
    }

    public String getName() {
        return name;
    }

    public Integer getX() {
        return x;
    }

    public Integer getY() {
        return y;
    }

    public Integer getWidth() {
        return width;
    }

    public Integer getHeight() {
        return height;
    }

    public static Builder builder() {
        return new Builder();
    }
}
