package cz.inovatika.knav.netlet.netleteditor;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.json.JSONObject;

import java.io.*;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.http.entity.StringEntity;
import org.apache.http.entity.mime.MultipartEntityBuilder;

/**
 *
 * @author alber
 */
public class PERORequester {

    public static final Logger LOGGER = Logger.getLogger(PERORequester.class.getName());

    private static final String SERVER_URL = Options.getInstance().getJSONObject("PERO").getString("server_url");
    private static final String API_KEY = Options.getInstance().getJSONObject("PERO").getString("api_key");

    public static boolean generate(String dir, String num) {
        String file = dir + Options.getInstance().getString("images_dir") + File.separator + num + ".jpg";
        String output = dir + Options.getInstance().getString("txt_dir") + File.separator + num + ".txt";
        String alto = dir + Options.getInstance().getString("alto_dir") + File.separator + num + ".xml";
        new File(dir + Options.getInstance().getString("images_dir")).mkdirs();
        new File(dir + Options.getInstance().getString("txt_dir")).mkdirs();
        new File(dir + Options.getInstance().getString("alto_dir")).mkdirs();
        return generate(file, output, alto);
    }

    public static boolean generate(String imagePath, String outputTxt, String outputAlto) {

        String fileExtension = imagePath.substring(imagePath.lastIndexOf('.') + 1);

        String fileName = new File(imagePath).getName().split("\\.")[0];
        String contentType = getContentType(fileExtension);

        JSONObject data = createJson(fileName);
        String txtFormat = "txt";
        String altoFormat = "alto";

        HttpClient httpClient = HttpClients.createDefault();
        String requestId = postProcessingRequest(httpClient, data);
        LOGGER.log(Level.INFO, "requestId is {0}", requestId);
        try {
            boolean uploaded = uploadImage(httpClient, requestId, fileName, imagePath, contentType);
            if (!uploaded) {
                return false;
            }
        } catch (IOException e) {
            LOGGER.log(Level.SEVERE, null, e);

        }

        String processingResult;
        do {
            processingResult = downloadResults(httpClient, outputTxt, requestId, fileName, txtFormat);
            if (processingResult.equals("PROCESSED")) {
                downloadResults(httpClient, outputAlto, requestId, fileName, altoFormat);
                LOGGER.log(Level.INFO, "Files {0} and {1} created!", new Object[]{txtFormat, altoFormat});
            } else {
                try {
                    TimeUnit.SECONDS.sleep(5);
                } catch (InterruptedException e) {
                    LOGGER.log(Level.SEVERE, null, e);
                }
            }
        } while (!processingResult.equals("PROCESSED"));
        return true;
    }

    private static JSONObject createJson(String fileName) {
        JSONObject outputData = new JSONObject();
        outputData.put(fileName, JSONObject.NULL);
        JSONObject dataDict = new JSONObject();
        dataDict.put("engine", 1);
        dataDict.put("images", outputData);
        return dataDict;
    }

    private static String postProcessingRequest(HttpClient httpClient, JSONObject data) {
        String url = SERVER_URL + "post_processing_request";
        HttpPost httpPost = new HttpPost(url);
        httpPost.addHeader("api-key", API_KEY);
        httpPost.setHeader("Content-Type", "application/json");
        try {
            httpPost.setEntity(new StringEntity(data.toString(), "UTF-8"));
            HttpResponse response = httpClient.execute(httpPost);
            if (response.getStatusLine().getStatusCode() < 400) {
                JSONObject jsonResponse = new JSONObject(EntityUtils.toString(response.getEntity()));
                while (!jsonResponse.getString("status").equals("success")) {
                    TimeUnit.SECONDS.sleep(15);
                    jsonResponse = checkStatus(httpClient, jsonResponse.getString("request_id"));
                }
                return jsonResponse.getString("request_id");
            } else {
                LOGGER.log(Level.SEVERE, "The post processing request ended with status code {0}.", response.getStatusLine().getStatusCode());
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, null, e);

        }
        return null;
    }

    private static JSONObject checkStatus(HttpClient httpClient, String requestId) throws IOException {
        String url = SERVER_URL + "get_status?request_id=" + requestId;
        HttpGet httpGet = new HttpGet(url);
        httpGet.addHeader("api-key", API_KEY);

        HttpResponse response = httpClient.execute(httpGet);
        if (response.getStatusLine().getStatusCode() == 200) {
            return new JSONObject(EntityUtils.toString(response.getEntity()));
        } else {
            throw new IOException("Unexpected code " + response.getStatusLine().getStatusCode());
        }
    }

    private static boolean uploadImage(HttpClient httpClient, String requestId, String fileName, String imagePath, String contentType) throws IOException {
        String url = SERVER_URL + "upload_image/" + requestId + "/" + fileName;
        HttpPost httpPost = new HttpPost(url);
        httpPost.addHeader("api-key", API_KEY);

        File file = new File(imagePath);
        final MultipartEntityBuilder builder = MultipartEntityBuilder.create();
        builder.addBinaryBody("file", file);
        final HttpEntity entity = builder.build();
        httpPost.addHeader("Content-Type", entity.getContentType().getValue());
        httpPost.setEntity(entity);

        HttpResponse response = httpClient.execute(httpPost);
        if (response.getStatusLine().getStatusCode() >= 400) {
            LOGGER.log(Level.INFO, "The image upload of {0} ended with status code {1}. {2}",
                    new Object[]{fileName, response.getStatusLine().getStatusCode(),
                        EntityUtils.toString(response.getEntity())
                    });
            return false;
        } else {
            LOGGER.log(Level.INFO, "The image upload of {0} ended with status code {1}.", new Object[]{fileName, response.getStatusLine().getStatusCode()});
            return true;
        }
    }

    private static String downloadResults(HttpClient httpClient, String outputDir, String requestId, String fileName, String resultFormat) {
        String url = SERVER_URL + "download_results/" + requestId + "/" + fileName + "/" + resultFormat;
        HttpGet httpGet = new HttpGet(url);
        httpGet.addHeader("api-key", API_KEY);

        try {
            HttpResponse response = httpClient.execute(httpGet);
            HttpEntity entity = response.getEntity();

            if (response.getStatusLine().getStatusCode() == 200) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(entity.getContent())); FileWriter writer = new FileWriter(outputDir)) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        writer.write(line);
                        writer.write("\n");
                    }
                    return "PROCESSED";
                }
            } else if (response.getStatusLine().getStatusCode() >= 400) {
                JSONObject jsonResponse = new JSONObject(EntityUtils.toString(entity));

                LOGGER.log(Level.SEVERE, "The request returned status code {0}. The message is: {1}",
                        new Object[]{response.getStatusLine().getStatusCode(), jsonResponse.getString("message")});

                if (jsonResponse.getString("message").contains("not processed yet")) {
                    return "UNPROCESSED";
                } else {
                    LOGGER.log(Level.INFO, jsonResponse.getString("message"));
                }
            }
        } catch (IOException e) {
            LOGGER.log(Level.SEVERE, null, e);

        }
        return null;
    }

    private static String getContentType(String fileExtension) {
        switch (fileExtension.toLowerCase()) {
            case "tiff":
            case "tif":
                return "image/tiff";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "jp2":
                return "image/jp2";
            default:
                LOGGER.log(Level.SEVERE, "Error: the extension {0} is not supported.",
                        fileExtension);
                return null;
        }
    }
}
