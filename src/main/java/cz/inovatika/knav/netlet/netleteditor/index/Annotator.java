
package cz.inovatika.knav.netlet.netleteditor.index;

import com.knuddels.jtokkit.Encodings;
import com.knuddels.jtokkit.api.Encoding;
import com.knuddels.jtokkit.api.EncodingRegistry;
import com.knuddels.jtokkit.api.ModelType;
import cz.inovatika.knav.netlet.netleteditor.Options;
import java.io.IOException;
import java.net.URISyntaxException;
import java.util.StringTokenizer;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.util.EntityUtils;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author alber
 */
public class Annotator {
    private static final String API_POINT = "https://api.openai.com/v1/chat/completions";
    
    public static String request(String data) throws URISyntaxException, IOException, InterruptedException {
  
        HttpClient httpClient = HttpClientBuilder.create().build();
        HttpPost request = new HttpPost(API_POINT);
        //request.addHeader("Accept", "text/plain");
        //request.addHeader("Content-Type", "application/x-www-form-urlencoded");
        request.setHeader("Content-Type","application/json");
        request.setHeader("Authorization", "Bearer " + Options.getInstance().getString("openAIKey"));
        request.setEntity(new StringEntity(data, "UTF-8"));

        // request.setEntity(entity);
        HttpResponse response = httpClient.execute(request);
        HttpEntity respEntity = response.getEntity();

        if (respEntity != null) {
            // EntityUtils to get the response content
            return EntityUtils.toString(respEntity, "UTF-8");
        } else {
            return "";
        }
    }

    public static JSONObject annotateMock(String text) {
        String resp = "{\n" +
"  \"created\": 1713256965,\n" +
"  \"usage\": {\n" +
"    \"completion_tokens\": 253,\n" +
"    \"prompt_tokens\": 1100,\n" +
"    \"total_tokens\": 1353\n" +
"  },\n" +
"  \"model\": \"gpt-3.5-turbo-0125\",\n" +
"  \"id\": \"chatcmpl-9EYgnraqsEg8HWXFKI82vTBq1M3GU\",\n" +
"  \"choices\": [{\n" +
"    \"finish_reason\": \"stop\",\n" +
"    \"index\": 0,\n" +
"    \"message\": {\n" +
"      \"role\": \"assistant\",\n" +
"      \"content\": \"{\\n  \\\"summary\\\": \\\"Jan Patočka děkuje Miladě Blekastadové za zásilku pojednání o německém překladu Panegyriku pro Karla Gustava, který objevila. Chválí ji za komentáře a historické exkursy, které připomínají práci prof. F. M. Bartoše. Dopis se zaměřuje na švédský neúspěch roku 1656 a Komenského politický program pro polské jinověrce a národní katolíky.\\\",\\n  \\\"sender\\\": \\\"Jan Patočka\\\",\\n  \\\"recipient\\\": \\\"Miladě Blekastadové\\\",\\n  \\\"date\\\": \\\"1960-10-30\\\",\\n  \\\"location\\\": \\\"neuvedeno\\\",\\n  \\\"incipit\\\": \\\"Děkuji Vám srdečně za Vaši zásilku\\\",\\n  \\\"explicit\\\": \\\"Ještě jednou děkuji Váš Patočka\\\"\\n}\"\n" +
"    },\n" +
"    \"logprobs\": null\n" +
"  }],\n" +
"  \"system_fingerprint\": \"fp_c2295e73ad\",\n" +
"  \"object\": \"chat.completion\"\n" +
"}";
        
        
//        String resp = "{\n" +
//"  \"created\": 1713267737,\n" +
//"  \"usage\": {\n" +
//"    \"completion_tokens\": 221,\n" +
//"    \"prompt_tokens\": 1656,\n" +
//"    \"total_tokens\": 1877\n" +
//"  },\n" +
//"  \"model\": \"gpt-3.5-turbo-0125\",\n" +
//"  \"id\": \"chatcmpl-9EbUXUGN564ZRlPmzIJ2jJbyiOE6r\",\n" +
//"  \"choices\": [{\n" +
//"    \"finish_reason\": \"stop\",\n" +
//"    \"index\": 0,\n" +
//"    \"message\": {\n" +
//"      \"role\": \"assistant\",\n" +
//"      \"content\": \"{\\n  \\\"summary\\\": \\\"Jan Patočka se omlouvá za zpožděné díkůvzdání a diskutuje o Komenském a jeho díle Truchlivý. Zajímá se o Miladu Blekastadovou a její činnost v komeniologii, nabízí zaslat své články a přeje jí zdaru v práci.\\\",\\n  \\\"sender\\\": \\\"Jan Patočka\\\",\\n  \\\"recipient\\\": \\\"Milada Blekastadová\\\",\\n  \\\"place\\\": \\\"bez udání místa\\\",\\n  \\\"date\\\": \\\"nepřesně datováno\\\",\\n  \\\"incipit\\\": \\\"Promiňte, prosím, dlouhý průtah mého díkůvzdání\\\",\\n  \\\"explicit\\\": \\\"Jsem s přáním dalšího zdaru v práci Váš oddaný Jan Patočka\\\"\\n}\"\n" +
//"    },\n" +
//"    \"logprobs\": null\n" +
//"  }],\n" +
//"  \"system_fingerprint\": \"fp_c2295e73ad\",\n" +
//"  \"object\": \"chat.completion\"\n" +
//"}";
//        
        JSONObject ret = new JSONObject(resp);
        return ret;
    }

    public static JSONObject annotate(String text, String prompt) {
        
        JSONObject ret = new JSONObject();
        try {
            EncodingRegistry registry = Encodings.newLazyEncodingRegistry();
            Encoding encoding = registry.getEncodingForModel(ModelType.GPT_3_5_TURBO_16K);
            
            JSONObject reqBody = Options.getInstance().getJSONObject("annotator");
            JSONArray messages = Options.getInstance().getJSONArray("chatGPTMessages");
            messages.getJSONObject(0).put("content", prompt);
            int tokenCount2 = encoding.countTokens(messages.toString());
            messages.getJSONObject(2).put("content", text);
            
            reqBody.put("messages", messages);
            
            int tokenCount = encoding.countTokens(text);
            ret.put("text_tokens", tokenCount)
                        .put("messages_tokens", tokenCount2)
                        .put("messages", messages.toString().length())
                        .put("text", text.length());
            if (tokenCount > Options.getInstance().getJSONObject("chatGPT").getInt("max_tokens")) {
                return ret.put("error", "big");
            } 
            String r = request(reqBody.toString());
            ret = new JSONObject(r);

        } catch (URISyntaxException | IOException | InterruptedException ex) {
            Logger.getLogger(NameTag.class.getName()).log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;

    }
}
