package com.saucelabs.visual.utils;

import static android.util.Base64.DEFAULT;

import android.app.UiAutomation;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.text.TextUtils;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.UiDevice;

import com.saucelabs.visual.exception.VisualApiException;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.parser.Parser;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
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

    public byte[] captureView(View view, boolean isFullPage) {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {

            int width = view.getWidth();
            int height;
            if (isFullPage && view instanceof FrameLayout) {
                height = ((FrameLayout) view).getChildAt(0).getHeight();
            } else {
                height = view.getHeight();
            }

            // Create a bitmap with the same size as the view
            Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);

            // Create a canvas to draw the view into the bitmap
            Canvas canvas = new Canvas(bitmap);

            // Draw the view onto the canvas without altering the view's position
            view.draw(canvas);

            bitmap.compress(Bitmap.CompressFormat.PNG, 100, os);
            return os.toByteArray();
        } catch (IOException e) {
            throw new VisualApiException(e.getLocalizedMessage());
        }
    }

    public byte[] captureScreen() {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            UiAutomation uiAutomation = InstrumentationRegistry.getInstrumentation().getUiAutomation();
            Bitmap screenshot = uiAutomation.takeScreenshot();
            screenshot.compress(Bitmap.CompressFormat.PNG, 100, os);
            return os.toByteArray();
        } catch (IOException e) {
            throw new VisualApiException(e.getLocalizedMessage());
        }
    }

    public byte[] captureDom(View clipElement) {
        String dom;
        UiDevice device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            device.dumpWindowHierarchy(os);
            dom = os.toString("UTF-8");
        } catch (IOException e) {
            throw new VisualApiException(e.getLocalizedMessage());
        }
        if (clipElement == null) {
            return wrapDom(dom).getBytes(StandardCharsets.UTF_8);
        }

        Document doc = Jsoup.parse(dom, Parser.xmlParser());
        String query = buildQuery(clipElement);
        Element element = doc.selectFirst(query);
        if (element != null) {
            return wrapDom(element.outerHtml()).getBytes(StandardCharsets.UTF_8);
        } else {
            throw new VisualApiException("Failed to clip DOM. No element matched:" + query);
        }
    }

    /**
     * Uses resource id and text of the view (if available) to locate the view inside DOM
     * Can be extended further to include more fields
     * @param view View to be queried
     * @return Jsoup parseable query to locate the view
     */
    private String buildQuery(View view) {
        String resourceId = view.getResources().getResourceName(view.getId());
        String text = view instanceof TextView ? ((TextView) view).getText().toString() : "";

        StringBuilder queryBuilder = new StringBuilder();
        queryBuilder.append(String.format("[resource-id=\"%s\"]", resourceId));
        if (!TextUtils.isEmpty(text)) {
            queryBuilder.append(String.format("[text=\"%s\"]", text));
        }
        return queryBuilder.toString();
    }

    private String wrapDom(String dom) {
        Document doc = Jsoup.parse(dom, Parser.xmlParser());
        doc.outputSettings().syntax(Document.OutputSettings.Syntax.xml);
        // Empty <hierarchy> root means DOM is already clipped
        String hierarchyRoot = doc.select("hierarchy").outerHtml();
        String domXml = !TextUtils.isEmpty(hierarchyRoot) ? hierarchyRoot : dom;
        return "<!DOCTYPE android-page-source>" +
                "<?xml version=\"1.0\"?>" +
                "<android-page-source>" +
                domXml +
                "</android-page-source>";
    }

    public void uploadDom(String uploadUrl, byte[] file) {
        uploadToUrl(uploadUrl, file, true);
    }

    public void uploadScreenshot(String uploadUrl, byte[] file) {
        uploadToUrl(uploadUrl, file, false);
    }

    private void uploadToUrl(String uploadUrl, byte[] file, boolean isDom) {
        HttpURLConnection connection = null;
        OutputStream os = null;
        try {
            String md5Hash = calculateMD5(file);

            URL url = new URL(uploadUrl);
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("PUT");

            // Set headers
            connection.setRequestProperty("Content-MD5", md5Hash);
            String contentType = isDom ? "text/html" : "image/png";
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
