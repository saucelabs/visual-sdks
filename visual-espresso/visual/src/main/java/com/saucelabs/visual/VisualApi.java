package com.saucelabs.visual;

import static android.util.Base64.DEFAULT;

import android.app.UiAutomation;
import android.graphics.Bitmap;
import android.util.Base64;
import android.util.Log;

import androidx.test.platform.app.InstrumentationRegistry;

import com.saucelabs.visual.VisualBuild.BuildAttributes;
import com.saucelabs.visual.exception.VisualApiException;
import com.saucelabs.visual.graphql.GraphQLClient;
import com.saucelabs.visual.graphql.mutation.CreateBuildMutation;
import com.saucelabs.visual.graphql.mutation.CreateBuildMutation.BuildIn;
import com.saucelabs.visual.graphql.mutation.CreateSnapshotMutation;
import com.saucelabs.visual.graphql.mutation.CreateSnapshotUploadMutation;
import com.saucelabs.visual.graphql.mutation.CreateSnapshotUploadMutation.CreateSnapshotUploadIn;
import com.saucelabs.visual.graphql.mutation.FinishBuildMutation;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;

public class VisualApi {
    private final static String LOG_TAG = VisualApi.class.getSimpleName();

    private final GraphQLClient graphQLClient;

    public VisualApi(GraphQLClient graphQLClient) {
        this.graphQLClient = graphQLClient;
    }

    VisualBuild createBuild(BuildAttributes buildAttributes) {
        CreateBuildMutation mutation =
                new CreateBuildMutation(
                        new BuildIn(
                                buildAttributes.name,
                                buildAttributes.project,
                                buildAttributes.branch,
                                buildAttributes.defaultBranch));
        CreateBuildMutation.Data data = graphQLClient.execute(mutation, CreateBuildMutation.Data.class);
        Log.i(LOG_TAG, String.format(" %n   Sauce Visual: %n%85s%n ", data.result.url));
        return new VisualBuild(
                data.result.id,
                data.result.name,
                data.result.project,
                data.result.branch,
                data.result.defaultBranch,
                data.result.url);
    }

    CreateSnapshotUploadMutation.Data uploadSnapshot(String buildId) {
        CreateSnapshotUploadMutation mutation = new CreateSnapshotUploadMutation(new CreateSnapshotUploadIn(buildId));
        CreateSnapshotUploadMutation.Data data = graphQLClient.execute(mutation, CreateSnapshotUploadMutation.Data.class);
        try {
            byte[] screenshot = getScreenshot();
            uploadToUrl(data.result.imageUploadUrl, screenshot);
        } catch (IOException e) {
            throw new VisualApiException("uploadSnapshot failed");
        }
        return data;
    }

    private byte[] getScreenshot() throws IOException {
        ByteArrayOutputStream os = null;
        try {
            UiAutomation uiAutomation = InstrumentationRegistry.getInstrumentation().getUiAutomation();
            Bitmap screenshot = uiAutomation.takeScreenshot();
            os = new ByteArrayOutputStream();
            screenshot.compress(Bitmap.CompressFormat.PNG, 100, os);
            return os.toByteArray();
        } finally {
            if (os != null) {
                os.close();
            }
        }
    }

    private void uploadToUrl(String uploadUrl, byte[] file) throws IOException {
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
        } catch (Exception e) {
            throw new VisualApiException("Snapshot upload failed", e);
        } finally {
            if (os != null) {
                os.close();
            }
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private String calculateMD5(byte[] data) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5");
        md.update(data);
        byte[] mdBytes = md.digest();
        return Base64.encodeToString(mdBytes, DEFAULT);
    }

    void createSnapshot(CreateSnapshotMutation.SnapshotIn snapshotIn) {
        CreateSnapshotMutation mutation = new CreateSnapshotMutation(snapshotIn);
        graphQLClient.execute(mutation, CreateSnapshotMutation.Data.class);
    }

    void finishBuild(String buildId) {
        FinishBuildMutation mutation =
                new FinishBuildMutation(new FinishBuildMutation.FinishBuildIn(buildId));
        graphQLClient.execute(mutation, FinishBuildMutation.Data.class);
    }

}
