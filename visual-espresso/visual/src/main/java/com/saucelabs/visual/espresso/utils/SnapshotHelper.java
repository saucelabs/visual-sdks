package com.saucelabs.visual.espresso.utils;

import static android.util.Base64.DEFAULT;

import android.app.UiAutomation;
import android.graphics.Bitmap;
import android.util.Base64;

import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.UiDevice;

import com.saucelabs.visual.espresso.exception.VisualApiException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class SnapshotHelper {

    private static SnapshotHelper instance;

    private SnapshotHelper() {
    }

    public static SnapshotHelper getInstance() {
        if (instance == null) {
            instance = new SnapshotHelper();
        }
        return instance;
    }

    public byte[] getScreenshot() {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            UiAutomation uiAutomation = InstrumentationRegistry.getInstrumentation().getUiAutomation();
            Bitmap screenshot = uiAutomation.takeScreenshot();
            screenshot.compress(Bitmap.CompressFormat.PNG, 100, os);
            return os.toByteArray();
        } catch (IOException e) {
            throw new VisualApiException(e.getLocalizedMessage());
        }
    }

    public byte[] getDom() {
        UiDevice device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            device.dumpWindowHierarchy(os);
            return os.toByteArray();
        } catch (IOException e) {
            throw new VisualApiException(e.getLocalizedMessage());
        }
    }

    public void uploadToUrl(String uploadUrl, byte[] file, boolean captureDom) {
        HttpURLConnection connection = null;
        OutputStream os = null;
        try {
            String md5Hash = calculateMD5(file);

            URL url = new URL(uploadUrl);
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("PUT");

            // Set headers
            connection.setRequestProperty("Content-MD5", md5Hash);
            String contentType = captureDom ? "text/html" : "image/png";
            connection.setRequestProperty("Content-Type", contentType);
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
