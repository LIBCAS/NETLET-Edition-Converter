package cz.inovatika.knav.netlet.netleteditor.index;

import com.google.common.base.Optional;
import com.optimaize.langdetect.LanguageDetector;
import com.optimaize.langdetect.LanguageDetectorBuilder;
import com.optimaize.langdetect.i18n.LdLocale;
import com.optimaize.langdetect.ngram.NgramExtractors;
import com.optimaize.langdetect.profiles.LanguageProfile;
import com.optimaize.langdetect.profiles.LanguageProfileReader;
import com.optimaize.langdetect.text.CommonTextObjectFactories;
import com.optimaize.langdetect.text.TextObject;
import com.optimaize.langdetect.text.TextObjectFactory;
import cz.inovatika.knav.netlet.netleteditor.Options;
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
import org.apache.tika.langdetect.optimaize.OptimaizeLangDetector;
import org.apache.tika.language.detect.LanguageResult;
import org.json.JSONObject;

/**
 *
 * @author alber
 */
public class Translator {

    private static final String API_POINT = Options.getInstance().getString("translationUrl");
    
    private static final org.apache.tika.language.detect.LanguageDetector detector = new OptimaizeLangDetector().loadModels();

    public static String request(String data, String src_lang, String tgt_lang) throws URISyntaxException, IOException, InterruptedException {

        HttpClient httpClient = HttpClientBuilder.create().build();
        HttpPost request = new HttpPost(API_POINT + "?src=" + src_lang + "&tgt=" + tgt_lang);
        request.addHeader("Accept", "text/plain");
        request.addHeader("Content-Type", "application/x-www-form-urlencoded");
        List<NameValuePair> params = new ArrayList<>();
        params.add(new BasicNameValuePair("input_text", data));
//        params.add(new BasicNameValuePair("src", src_lang));
//        params.add(new BasicNameValuePair("tgt", tgt_lang));
        request.setEntity(new UrlEncodedFormEntity(params, "UTF-8"));

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

    public static JSONObject translate(String text) {
        JSONObject ret = new JSONObject();
        try {
            List<LanguageResult> langs = detectLanguages(text);
            String src_lang = langs.get(0).getLanguage();
            // String src_lang = detectLang(text);
            ret = new JSONObject()
                    .put("lang", src_lang);
            for (LanguageResult l : langs) {
                ret.append("languages", l.getLanguage());
            }
                    
            if (!"cs".equals(src_lang)) {                
                String r = request(text, src_lang, "cs");
                ret.put("text", r);
            }

        } catch (URISyntaxException | IOException | InterruptedException ex) {
            Logger.getLogger(NameTag.class.getName()).log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;

    }

    public static String detectLang(String text) throws IOException {
        //load all languages:
        List<LanguageProfile> languageProfiles = new LanguageProfileReader().readAllBuiltIn();

        //build language detector:
        LanguageDetector languageDetector = LanguageDetectorBuilder.create(NgramExtractors.standard())
                .withProfiles(languageProfiles)
                .build();

        //create a text object factory
        TextObjectFactory textObjectFactory = CommonTextObjectFactories.forDetectingOnLargeText();

        //query:
        TextObject textObject = textObjectFactory.forText(text);
        Optional<LdLocale> lang = languageDetector.detect(textObject);
        return lang.get().getLanguage();
    }
    
    public static List<LanguageResult> detectLanguages(String text) throws IOException {
        List<LanguageResult> result = detector.detectAll(text);
        detector.reset();
        return result;
    }
}
