package cz.knav.netlet.netleteditor.index;

import cz.knav.netlet.netleteditor.Imagging;
import cz.knav.netlet.netleteditor.Options;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author alber
 */
public class GeminiAnalyzer {

    public static JSONObject analyze(String filename, JSONArray selection) throws IOException, InterruptedException {
        JSONObject jsonRequest = new JSONObject();
        JSONObject geminiConfig = Options.getInstance().getJSONObject("gemini");
        JSONArray parts = new JSONArray();

        for (int i = 0; i < selection.length(); i++) { 
            JSONObject json = selection.getJSONObject(i);
            String encodedString = Imagging.selectionToBase64Simple(filename, json);
            parts.put(new JSONObject().put("inlineData", new JSONObject().put("mimeType", "image/jpeg").put("data", encodedString)));
        }
        //parts.put(new JSONObject().put("inlineData", new JSONObject().put("mimeType", "application/pdf").put("data", base64Pdf)));
        JSONArray texts = geminiConfig.getJSONArray("text");
        for (int i = 0; i < texts.length(); i++) { 
            parts.put(new JSONObject().put("text", texts.getString(i)));
        }
        jsonRequest.put("model", "gemini-2.5-flash");
        jsonRequest.put("contents", new JSONObject().put("parts", parts));
        jsonRequest.put("generationConfig", geminiConfig.getJSONObject("config"));

        // 3. Send REST request using Java HttpClient
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest restRequest = HttpRequest.newBuilder()
                .uri(URI.create(geminiConfig.getString("url") + geminiConfig.getString("api_key")))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonRequest.toString()))
                .build();

        HttpResponse<String> restResponse = client.send(restRequest, HttpResponse.BodyHandlers.ofString());
        return new JSONObject(restResponse.body());
    }
}
