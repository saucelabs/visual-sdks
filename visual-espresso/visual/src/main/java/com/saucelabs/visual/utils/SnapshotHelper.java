package com.saucelabs.visual.utils;

import static android.util.Base64.DEFAULT;

import static androidx.test.espresso.Espresso.onView;

import android.app.UiAutomation;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.util.Base64;
import android.view.View;

import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.UiDevice;

import com.saucelabs.visual.espresso.GetViewAction;
import com.saucelabs.visual.exception.VisualApiException;

import org.hamcrest.Matcher;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

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

    public byte[] getScreenshot(View view) {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            // Get the width and height of the view
            int width = view.getWidth();
            int height = view.getHeight();

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
            return wrapDom(os.toByteArray());
        } catch (IOException e) {
            throw new VisualApiException(e.getLocalizedMessage());
        }
    }

    private byte[] wrapDom(byte[] originalDom) {
        try (ByteArrayInputStream is = new ByteArrayInputStream(originalDom)) {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Element originalRootElement = builder.parse(is).getDocumentElement();

            // Get a new XML document
            Document newDocument = builder.newDocument();

            // Add the root element
            Element newRoot = newDocument.createElement("android-page-source");
            newDocument.appendChild(newRoot);

            // Append the originalRoot
            Node importedRoot = newDocument.importNode(originalRootElement, true);
            newRoot.appendChild(importedRoot);

            return convertXMLToByteArray(new DOMSource(newDocument));
        } catch (Exception e) {
            throw new VisualApiException(e.getLocalizedMessage());
        }
    }

    private byte[] convertXMLToByteArray(DOMSource source) {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {

            // Add the xml declaration manually
            String xmlDeclaration = "<?xml version=\"1.0\"?>";
            os.write(xmlDeclaration.getBytes("UTF-8"));

            TransformerFactory transformerFactory = TransformerFactory.newInstance();
            Transformer transformer = transformerFactory.newTransformer();

            transformer.setOutputProperty(OutputKeys.METHOD, "xml");
            transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");

            // Transform the document to a string
            StreamResult result = new StreamResult(os);
            transformer.transform(source, result);

            // Convert the output to a string
            String xmlString = os.toString("UTF-8");

            // Prepend the DOCTYPE declaration manually
            String docType = "<!DOCTYPE android-page-source>";
            String finalXml = docType + xmlString;

            return finalXml.getBytes("UTF-8");
        } catch (Exception e) {
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
