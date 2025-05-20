package com.saucelabs.visual.utils;

import com.saucelabs.visual.exception.VisualApiException;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import javax.imageio.ImageIO;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.Rectangle;

public class ImageHelpers {
  public static BufferedImage cropImage(BufferedImage image, Rectangle cropRegion) {
    return image.getSubimage(cropRegion.x, cropRegion.y, cropRegion.width, cropRegion.height);
  }

  public static BufferedImage loadImage(byte[] imageData) {
    ByteArrayInputStream stream = new ByteArrayInputStream(imageData);
    try {
      return ImageIO.read(stream);
    } catch (IOException e) {
      throw new VisualApiException("Failed to load image from bytes", e);
    }
  }

  public static byte[] saveImage(BufferedImage image, String imageFormat) {
    ByteArrayOutputStream stream = new ByteArrayOutputStream();
    try {
      ImageIO.write(image, imageFormat, stream);
      return stream.toByteArray();
    } catch (IOException e) {
      throw new VisualApiException("Failed to save image to bytes", e);
    }
  }

  public static Dimension getImageDimensions(byte[] image) {
    BufferedImage bImage = loadImage(image);
    return new Dimension(bImage.getWidth(), bImage.getHeight());
  }
}
