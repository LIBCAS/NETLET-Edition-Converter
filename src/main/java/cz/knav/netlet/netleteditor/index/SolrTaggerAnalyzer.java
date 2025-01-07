/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package cz.knav.netlet.netleteditor.index;

import cz.knav.netlet.netleteditor.Options;
import java.io.IOException;
import java.util.AbstractMap.SimpleEntry;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrRequest;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.client.solrj.impl.NoOpResponseParser;
import org.apache.solr.client.solrj.request.ContentStreamUpdateRequest;
import org.apache.solr.client.solrj.request.QueryRequest;
import org.apache.solr.client.solrj.response.UpdateResponse;
import org.apache.solr.common.params.SolrParams;
import org.apache.solr.common.util.ContentStream;
import org.apache.solr.common.util.ContentStreamBase;
import org.apache.solr.common.util.NamedList;
import org.json.JSONObject;

/**
 *
 * @author alberto
 */
public class SolrTaggerAnalyzer {

  static final Logger LOGGER = Logger.getLogger(SolrTaggerAnalyzer.class.getName());
  public static String COLLECTION = "dictionaries";

  public static JSONObject getTagsJSON(String text, String field) {
    JSONObject ret = new JSONObject();
    try (SolrClient solr = new HttpSolrClient.Builder(Options.getInstance().getString("solr")).build()) { 
      SolrQuery query = new SolrQuery();
      query.setRequestHandler("/tag");
      query.set("overlaps", "NO_SUB")
              .set("wt", "json")
              .set("indent", "on")
              .set("field", field)
              .set("matchText", true)
              .set("skipAltTokens", true)
              .set("fl", "*,score")
              .set("tagsLimit", "5000");

      ContentStreamUpdateRequest req = new ContentStreamUpdateRequest("");
      req.addContentStream(new ContentStreamBase.StringStream(text));
      req.setMethod(SolrRequest.METHOD.POST);
      NoOpResponseParser rawJsonResponseParser = new NoOpResponseParser();
      rawJsonResponseParser.setWriterType("json");
      req.setResponseParser(rawJsonResponseParser);
      req.setPath("/tag");
      req.setParams(query);
      UpdateResponse rsp = req.process(solr, COLLECTION);
      NamedList nlr = rsp.getResponse();

      ret = new JSONObject((String) nlr.get("response"));
      solr.close();
    } catch (IOException | SolrServerException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
      ret.put("error", ex);
    }
    return ret;
  }

  public static JSONObject getTags(String text) {
    JSONObject ret = new JSONObject();
    try (SolrClient solr = new HttpSolrClient.Builder(Options.getInstance().getString("solr.host", "http://localhost:8983/solr/")).build()) {

      List<String> supportedLangs = new ArrayList<>();
      supportedLangs.add("eng");
      supportedLangs.add("cze");
      String lang = "eng";
      // List<String> supportedLangs = List.of("eng","cze");
      ret.put("lang", lang);
      String field = "key_tagger_" + lang;
      SolrQuery query = new SolrQuery();
      query.setRequestHandler("/tag");
      query.set("overlaps", "NO_SUB")
              .set("wt", "json")
              .set("indent", "on")
              .set("field", field)
              .set("matchText", true)
              .set("skipAltTokens", true)
              .set("fl", "*,score")
              .set("tagsLimit", "5000");


      QueryRequest queryRequest = new SolrTaggerRequest(query, text);
      NamedList nlr = solr.request(queryRequest, COLLECTION);
      // ret.put("body", processResponse(nlr, lang, candidates, false));


      List<SimpleEntry<String, Integer>> tocThemes = new ArrayList<>();
      

      JSONObject tb = ret.getJSONObject("body").getJSONObject("themes");
      for (Object theme : tb.keySet()) {
        tocThemes.add(new SimpleEntry<>((String) theme, tb.getInt((String) theme)));
      }
      
      ret.put("candidates", tocThemes);

      solr.close();
    } catch (IOException | SolrServerException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
      ret.put("error", ex);
    }

    return ret;
  }

  @SuppressWarnings("serial")
  public static class SolrTaggerRequest extends QueryRequest {

    private final String input;

    public SolrTaggerRequest(SolrParams p, String input) {
      super(p, SolrRequest.METHOD.POST);
      this.input = input;
    }

    @Override
    public Collection<ContentStream> getContentStreams() {
      return Collections.singleton((ContentStream) new ContentStreamBase.StringStream(input));
    }
  }
}
