/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package cz.knav.netlet.netleteditor.index;

import cz.knav.netlet.netleteditor.Options;
import cz.knav.netlet.netleteditor.PDFThumbsGenerator;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.Http2SolrClient;
import org.apache.solr.common.SolrInputDocument;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author alber
 */
public class LetterMapping {

    public final Logger LOGGER = Logger.getLogger(Indexer.class.getName());
    JSONObject files = new JSONObject();

    public JSONObject transform() {
        JSONObject ret = new JSONObject();
        String url = Options.getInstance().getString("solr", "http://localhost:8983/solr/")
                + "/letters_old/select?rows=100&q=-hiko_id:*&wt=json&fl=*";

        try (HttpClient httpclient = HttpClient
                .newBuilder()
                .build()) {
            JSONArray fs = PDFThumbsGenerator.getDocuments().getJSONArray(("dirs"));
            for (int i = 0; i < fs.length(); i++) {
                    files.put(fs.getJSONObject(i).getString("filename"), fs.getJSONObject(i));
                }
            // ret.put("files", files);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(url))
                    .GET()
                    .build();
            HttpResponse<String> response = httpclient.send(request, HttpResponse.BodyHandlers.ofString());
            JSONArray docs = new JSONObject(response.body()).getJSONObject("response").getJSONArray("docs");
            try (SolrClient client = new Http2SolrClient.Builder(Options.getInstance().getString("solr")).build()) {
                for (int i = 0; i < docs.length(); i++) {
                    transformDoc(docs.getJSONObject(i), client);
                    ret.put("transformed", i + 1);
                }
                client.commit("letters");
                LOGGER.log(Level.INFO, "Transform FINISHED");
            } catch (IOException | SolrServerException ex) {
                LOGGER.log(Level.SEVERE, null, ex);
                ret.put("error", ex);
            }
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
        }
        return ret;
    }

    private void transformDoc(JSONObject doc, SolrClient solr) throws SolrServerException, IOException {
        SolrInputDocument idoc = new SolrInputDocument();
        idoc.setField("id", doc.getString("id"));
        idoc.setField("hiko_id", doc.optString("hiko_id"));
        idoc.setField("filename", doc.getString("filename"));
        idoc.setField("file_id", doc.getString("file_id"));
        
        idoc.setField("tenant", files.getJSONObject(doc.getString("filename")).getJSONObject("config").getString("tenant"));
                
        idoc.setField("startPage", doc.getInt("startPage"));
        if (doc.has("page_number")) {
            idoc.setField("page_number", doc.getInt("page_number"));
        }
        if (doc.has("date")) {
            idoc.setField("date", doc.getString("date"));
        }
        

        JSONObject data_old = new JSONObject(doc.getString("data"));
        
        if (data_old.has("selection")) {
            idoc.setField("selection", data_old.get("selection").toString());
        }
        
        JSONObject data_new = new JSONObject();
                
        data_new.put("hiko_id", data_old.opt("hiko_id"));
        data_new.put("startPage", data_old.opt("startPage"));
        data_new.put("endPage", data_old.opt("endPage"));
        data_new.put("end_page_number", data_old.opt("end_page_number"));
        data_new.put("date", data_old.opt("date"));
        data_new.put("date_marked", data_old.opt("date_marked"));
        data_new.put("signature", data_old.opt("signature"));
        data_new.put("languages", data_old.opt("languages"));
        data_new.put("letter_number", data_old.opt("letter_number"));

        JSONObject a = new JSONObject()
                .put("cs", data_old.opt("abstract_cs"))
                .put("en", data_old.opt("abstract_en"));
        data_new.put("abstract", a); 

        data_new.put("explicit", data_old.opt("explicit"));
        data_new.put("incipit", data_old.opt("incipit"));
        data_new.put("content", data_old.opt("full_text"));

        data_new.put("page_number", data_old.opt("page_number"));
        
        data_new.put("letter_title", data_old.opt("letter_title"));
        data_new.put("salutation", data_old.opt("salutation"));
        data_new.put("sign_off", data_old.opt("sign_off"));
        
        JSONArray ai = new JSONArray();
        ai.put(new JSONObject()
                .put("date", doc.get("indextime"))
                .put("analysis", data_old.opt("analysis")));

        if (data_old.has("author_db")) {
            JSONObject au = new JSONObject()
                    .put("id", Integer.valueOf(data_old.getJSONObject("author_db").getString("id").split("_")[1]))
                    .put("name", data_old.getJSONObject("author_db").getString("name"));
            
            if (doc.has("author")) {
                au.put("marked", doc.getJSONArray("author").getString(0));
            }
            data_new.append("authors", au);
        }
        if (doc.has("author")) {
            idoc.setField("author", doc.get("author"));
        }

        if (data_old.has("recipient_db")) {
            JSONObject au = new JSONObject()
                    .put("id", Integer.valueOf(data_old.getJSONObject("recipient_db").getString("id").split("_")[1]))
                    .put("name", data_old.getJSONObject("recipient_db").getString("name")); 
            if (doc.has("recipient")) {
                au.put("marked", doc.getJSONArray("recipient").getString(0));
            }
            data_new.append("recipients", au);
        }
        if (doc.has("recipient")) {
            idoc.setField("recipient", doc.get("recipient"));
        }

        if (data_old.has("origin")) {
            JSONObject au = new JSONObject()
                    .put("marked", data_old.getString("origin"));
            data_new.append("origins", au);
            idoc.setField("origin", data_old.get("origin"));
        }

        if (data_old.has("destination")) {
            JSONObject au = new JSONObject()
                    .put("marked", data_old.getString("destination"));
            data_new.append("destinations", au);
            idoc.setField("destination", data_old.get("destination"));
        }

//        if (data_old.has("copies")) {
//            JSONObject au = new JSONObject()
//                    .put("marked", data_old.getString("origin"));
//            data_new.append("copies", au);
//        }
        data_new.put("copies", data_old.opt("copies"));

        data_new.put("status", "draft");

        idoc.setField("hiko", data_new.toString());
        idoc.setField("ai", ai.toString());
        solr.add("letters", idoc); 
    }
}
