package cz.knav.netlet.netleteditor.index;

import cz.knav.netlet.netleteditor.Options;
import java.io.IOException;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;
import org.json.JSONObject;

/**
 *
 * @author alber
 */
public class NameTag {

    private static final String API_POINT = Options.getInstance().getString("nametagUrl");

    public static String request(String url, String data) throws URISyntaxException, IOException, InterruptedException {

        HttpClient httpClient = HttpClientBuilder.create().build();
        HttpPost request = new HttpPost(API_POINT + url);

        List<NameValuePair> params = new ArrayList<NameValuePair>();
        params.add(new BasicNameValuePair("data", data));
        params.add(new BasicNameValuePair("output", "vertical"));
        request.setEntity(new UrlEncodedFormEntity(params, "UTF-8"));

        // request.setEntity(entity);
        HttpResponse response = httpClient.execute(request);
        HttpEntity respEntity = response.getEntity();

        if (respEntity != null) {
            // EntityUtils to get the response content
            return EntityUtils.toString(respEntity);
        } else {
            return "";
        }
    }

    public static JSONObject recognize(String text) {
        JSONObject ret = new JSONObject();
        try {
            String r = request("recognize", text);
            ret = new JSONObject(r);
            String vert = ret.getString("result");
            String[] lines = vert.split("\n");
            for (String line : lines) {
                String[] parts = line.split("\t");
                JSONObject l = new JSONObject()
                        .put("pos", parts[0].split(","))
                        .put("type", parts[1])
                        .put("text", parts[2]);

                ret.append("tags", l);
            }
//            ret.put("xml", ret.getString("result"));
//            ret.put("result", JSONML.toJSONObject("<sentences>"+ret.getString("result")+"</sentences>"));
        } catch (URISyntaxException | IOException | InterruptedException ex) {
            Logger.getLogger(NameTag.class.getName()).log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;

    }
}
