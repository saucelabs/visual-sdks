package com.saucelabs.visual.espresso.utils;

import static android.util.Base64.DEFAULT;

import android.app.UiAutomation;
import android.graphics.Bitmap;
import android.util.Base64;

import androidx.test.platform.app.InstrumentationRegistry;

import com.saucelabs.visual.espresso.exception.VisualApiException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class ScreenshotHelper {

    private static ScreenshotHelper instance;

    private ScreenshotHelper() {
    }

    public static ScreenshotHelper getInstance() {
        if (instance == null) {
            instance = new ScreenshotHelper();
        }
        return instance;
    }

    public byte[] getScreenshot() {
        ByteArrayOutputStream os = null;
        try {
            UiAutomation uiAutomation = InstrumentationRegistry.getInstrumentation().getUiAutomation();
            Bitmap screenshot = uiAutomation.takeScreenshot();
            os = new ByteArrayOutputStream();
            screenshot.compress(Bitmap.CompressFormat.PNG, 100, os);
            return os.toByteArray();
        } finally {
            if (os != null) {
                try {
                    os.close();
                } catch (IOException ignored) {
                }
            }
        }
    }

    public void uploadToUrl(String uploadUrl, byte[] file) {
        HttpURLConnection connection = null;
        OutputStream os = null;
        try {
            String md5Hash = calculateMD5(file);

            URL url = new URL(uploadUrl);
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("PUT");

            // Set headers
            connection.setRequestProperty("Content-MD5", md5Hash);
            connection.setRequestProperty("Content-Type", "image/png");
            connection.setDoOutput(true);

            // Write file to output stream
            os = connection.getOutputStream();
            os.write(file);
            os.flush();

            // Get the response code
            int responseCode = connection.getResponseCode();
            if (responseCode != HttpURLConnection.HTTP_OK) {
                throw new VisualApiException("Snapshot upload failed. Response code: " + responseCode);
            }
        } catch (IOException e) {
            throw new VisualApiException("Snapshot upload failed due to an I/O error", e);
        } finally {
            if (os != null) {
                try {
                    os.close();
                } catch (IOException ignored) {
                }
            }
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private String calculateMD5(byte[] data) {
        MessageDigest md;
        try {
            md = MessageDigest.getInstance("MD5");
        } catch (NoSuchAlgorithmException e) {
            throw new VisualApiException(e.getLocalizedMessage());
        }
        md.update(data);
        byte[] mdBytes = md.digest();
        return Base64.encodeToString(mdBytes, DEFAULT);
    }
}
