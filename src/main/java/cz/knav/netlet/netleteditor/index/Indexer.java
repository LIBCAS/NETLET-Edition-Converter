package cz.knav.netlet.netleteditor.index;

import com.alibaba.fastjson2.JSON;
import cz.knav.netlet.netleteditor.Options;
import cz.knav.netlet.netleteditor.Storage;
import cz.knav.netlet.netleteditor.Utils;
import cz.knav.netlet.netleteditor.alto.AltoBlock;
import cz.knav.netlet.netleteditor.alto.AltoLine;
import cz.knav.netlet.netleteditor.alto.AltoPrintSpace;
import cz.knav.netlet.netleteditor.alto.AltoString;
import java.io.File;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.xml.bind.DatatypeConverter;
import org.apache.commons.io.FileUtils;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.beans.DocumentObjectBinder;
import org.apache.solr.client.solrj.impl.Http2SolrClient;
import org.apache.solr.client.solrj.impl.NoOpResponseParser;
import org.apache.solr.client.solrj.request.QueryRequest;
import org.apache.solr.client.solrj.response.UpdateResponse;
import org.apache.solr.common.SolrInputDocument;
import org.apache.solr.common.util.NamedList;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author alberto
 */
public class Indexer {

    public static final Logger LOGGER = Logger.getLogger(Indexer.class.getName());

    private static SolrClient _solr;

    public static SolrClient getClient() {
        try {
            if (_solr == null) {
                String url = Options.getInstance().getString("solr");
                _solr = new Http2SolrClient.Builder(url).build();
            }
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
        }
        return _solr;
    }
    
    public static void closeClient() throws IOException {
        if (_solr != null) {
            _solr.close();
        }
    }

    public static JSONObject indexPdfFile(String filename) {
        JSONObject ret = new JSONObject();
        try {
            SolrClient solr = getClient();
            File f = new File(Storage.altoDir(filename));

            if (f.exists()) {
                String[] files = f.list();
//        String pageStr = files[30].replaceAll(".xml", "");
//        ret.append("pages", indexPage(solr, filename, Integer.parseInt(pageStr)));
//        pageStr = files[20].replaceAll(".xml", "");
//        ret.append("pages", indexPage(solr, filename, Integer.parseInt(pageStr)));
                for (String file : files) {
                    String pageStr = file.replaceAll(".xml", "");
                    ret.append("pages", indexPage(solr, filename, Integer.parseInt(pageStr)));
                }
            } else {
                ret.put("error", "File not found");
            }
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;

    }

    public static JSONObject indexPage(SolrClient solr, String filename, int page) throws IOException, SolrServerException {
        JSONObject ret = new JSONObject();

        File f = Storage.altoPageFile(filename, page);

        if (f.exists()) {
            String xml = FileUtils.readFileToString(f, "UTF-8");
            // ret = JSONML.toJSONObject(xml);
            JSONObject altoXml = Utils.altoXMLToJSON(xml);
            JSONObject printSpace = altoXml
                    .getJSONObject("alto")
                    .getJSONObject("Layout")
                    .getJSONObject("Page")
                    .getJSONObject("PrintSpace");

            AltoPrintSpace aps = JSON.parseObject(printSpace.toString(), AltoPrintSpace.class);
            if (aps == null) {
                ret.put("error", "AltoPrintSpace not found");
                return ret;
            }
            for (AltoBlock tb : aps.TextBlock) {
                DocumentObjectBinder dob = new DocumentObjectBinder();
                SolrInputDocument idoc = dob.toSolrInputDocument(tb);
                idoc.setField("id", filename + "_" + page + "_" + tb.ID);
                idoc.setField("blockid", tb.ID);
                idoc.setField("filename", filename);
                idoc.setField("page", page);

                String content = "";
                for (AltoLine al : tb.TextLine) {
                    idoc.addField("lines", al.toString());
                    for (AltoString as : al.String) {
                        content += as.CONTENT + " ";
                    }
                }
                idoc.setField("content", content);

                // "ENVELOPE(minX, maxX, maxY, minY)"
                // Should normalize by page width
                // coordinates are between -90 - 90 latitude, 180 - 180 longitude
                double scale = 1.0f / Options.getInstance().getInt("maxMedium", 2000);

                String block_rect = String.format("ENVELOPE(%f, %f, %f, %f)", tb.HPOS * scale, (tb.HPOS + tb.WIDTH) * scale, (tb.VPOS + tb.HEIGHT) * scale, tb.VPOS * scale);
                idoc.setField("block_rect", block_rect);

                // idoc.setField("TextLine", tb.TextLine.toString());
                idoc.setField("id", filename + "_" + page + "_" + tb.ID);
                solr.add("pdfs", idoc);
                solr.commit("pdfs");
            }
            ret.put("blocks", aps.TextBlock.size());
        } else {
            ret.put("error", "File not found");
        }

        return ret;
    }

    public static JSONObject findSimilar(JSONObject params) {
        JSONObject ret = new JSONObject();
        try {
            // String filename, int page, String jsonBlock
            JSONObject selection = params.getJSONObject("selection");
            AltoBlock ab = JSON.parseObject(selection.getJSONArray("blocks").getJSONObject(0).toString(), AltoBlock.class);
            AltoLine al = JSON.parseObject(selection.getJSONArray("lines").getJSONObject(0).toString(), AltoLine.class);
            boolean onlyBox = params.optBoolean("onlyBox");
            boolean twoCols = params.optBoolean("twoCols");
            String q = "*";
            if (!onlyBox) {
                q = al.getTextContent();
            }
            Http2SolrClient solr = (Http2SolrClient) getClient();
            SolrQuery query = new SolrQuery(q)
                    .addFilterQuery("filename:\"" + params.getString("filename") + "\"")
                    .addFilterQuery(String.format("WIDTH:[%d TO %d]", ab.WIDTH - 10, ab.WIDTH + 10))
                    .setParam("defType", "edismax")
                    .setParam("mm", "75%")
                    .setParam("qf", "content")
                    .addSort("page", SolrQuery.ORDER.asc)
                    .addSort("HPOS", SolrQuery.ORDER.asc)
                    .setFields("*,lines:[json]")
                    .setRows(1000);

            if (twoCols) {
                // get page width
                JSONObject altoXml = Utils.getAlto(params.getString("filename"), 10);
                JSONObject printSpace = altoXml
                        .getJSONObject("alto")
                        .getJSONObject("Layout")
                        .getJSONObject("Page")
                        .getJSONObject("PrintSpace");
                AltoPrintSpace aps = JSON.parseObject(printSpace.toString(), AltoPrintSpace.class);
                long half = Math.round(aps.WIDTH / 2.0) + aps.HPOS;
                query.addFilterQuery(String.format("HPOS:[%d TO %d] OR HPOS:[%d TO %d]",
                        ab.HPOS - 10,
                        ab.HPOS + 10,
                        ab.HPOS + half - 10,
                        ab.HPOS + half + 10));
            } else {
                query.addFilterQuery(String.format("HPOS:[%d TO %d]", ab.HPOS - 10, ab.HPOS + 10));
            }

            //        defType=&fl=content%2CHPOS%2CVPOS%2CHEIGHT%2CWIDTH%2Cpage&fq=WIDTH%3A%5B235%20TO%20240%5D&indent=true&mm=75%25&q.op=OR&q=E.%20Beneš%20T.%20G.%20Masarykovi&qf=content&rows=60&sort=page%20asc%2C%20HPOS%20asc&useParams=;
            query.set("wt", "json");
            String jsonResponse;

            QueryRequest qreq = new QueryRequest(query);
            // qreq.setPath();
            NoOpResponseParser dontMessWithSolr = new NoOpResponseParser();
            dontMessWithSolr.setWriterType("json");
            solr.setParser(dontMessWithSolr);
            NamedList<Object> qresp = solr.request(qreq, "pdfs");
            jsonResponse = (String) qresp.get("response");
            ret = new JSONObject(jsonResponse);

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;
    }

    public JSONObject indexKeywords() {

        JSONObject ret = new JSONObject();
        //client = getClient("keywords");
        try {
            SolrClient solr = getClient();
//            SimpleKeywordsReader r = new SimpleKeywordsReader("keywords");
//            r.readFromTxt(Options.class.getResourceAsStream("653_klicova_slova_b.txt"), solr);

//            File dir = new File(Options.getInstance().getString("sources_dir"));
//            ret = HikoKeywordsIndexer.fromJSON(dir, solr);
            ret = GeoNamesIndexer.index(solr);

            solr.commit("dictionaries");

        } catch (IOException | SolrServerException ex) {
            ret.put("error", ex);
            Logger.getLogger(Indexer.class.getName()).log(Level.SEVERE, null, ex);
        }
        return ret;

    }

    public static JSONObject getLetters(String filename) {
        JSONObject ret = new JSONObject();
        try {
            Http2SolrClient solr = (Http2SolrClient) getClient();
            SolrQuery query = new SolrQuery("*")
                    .addFilterQuery("filename:\"" + filename + "\"")
                    .setFields("*,hiko:[json],ai:[json],selection:[json]")
                    .addSort("startPage", SolrQuery.ORDER.asc)
                    .addSort("page_number", SolrQuery.ORDER.asc)
                    .setRows(1000);
            query.set("wt", "json");
            String jsonResponse;

            QueryRequest qreq = new QueryRequest(query);
            // qreq.setPath();
            NoOpResponseParser dontMessWithSolr = new NoOpResponseParser();
            dontMessWithSolr.setWriterType("json");
            solr.setParser(dontMessWithSolr);
            NamedList<Object> qresp = solr.request(qreq, "letters");
            jsonResponse = (String) qresp.get("response");
            ret = new JSONObject(jsonResponse);

        } catch (Exception ex) { 
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;
    }
    
    public static JSONObject getLettersTotals() {
        JSONObject ret = new JSONObject();
        try {
            Http2SolrClient solr = (Http2SolrClient) getClient();
            SolrQuery query = new SolrQuery("*")
                    .setRows(0)
                    .setFacet(true)
                    .addFacetField("filename")
                    .setParam("json.nl", "map")
                    .setFacetMinCount(0)
                    .setFacetLimit(1000);
            query.set("wt", "json");
            String jsonResponse;

            QueryRequest qreq = new QueryRequest(query);
            // qreq.setPath();
            NoOpResponseParser dontMessWithSolr = new NoOpResponseParser();
            dontMessWithSolr.setWriterType("json");
            solr.setParser(dontMessWithSolr);
            NamedList<Object> qresp = solr.request(qreq, "letters");
            jsonResponse = (String) qresp.get("response");
            ret = new JSONObject(jsonResponse);

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;
    }
    
    public static JSONObject getTenants() {
        JSONObject ret = new JSONObject();
        try {
            Http2SolrClient solr = (Http2SolrClient) getClient();
            SolrQuery query = new SolrQuery("*")
                    .setRows(0)
                    .setFacet(true)
                    .addFacetField("tenant")
                    .setParam("json.nl", "map")
                    .setFacetMinCount(0)
                    .setFacetLimit(1000);
            query.set("wt", "json");
            String jsonResponse;

            QueryRequest qreq = new QueryRequest(query);
            // qreq.setPath();
            NoOpResponseParser dontMessWithSolr = new NoOpResponseParser();
            dontMessWithSolr.setWriterType("json");
            solr.setParser(dontMessWithSolr);
            NamedList<Object> qresp = solr.request(qreq, "identities");
            jsonResponse = (String) qresp.get("response");
            ret = new JSONObject(jsonResponse);

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;
    }
    
    
    public static JSONObject removeLetter(String id) {
        JSONObject ret = new JSONObject();
        try {

            Http2SolrClient solr = (Http2SolrClient) getClient();
            
            UpdateResponse r = solr.deleteById("letters", id);
            solr.commit("letters");
            ret.put("msg", "deleted");

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;
    }

    public static JSONObject getLetter(String id) {
        JSONObject ret = new JSONObject();
        try {

            Http2SolrClient solr = (Http2SolrClient) getClient();
            SolrQuery query = new SolrQuery("*")
                    .addFilterQuery("id:\"" + id + "\"")
                    .setFields("*,hiko:[json],ai:[json],selection:[json]")
                    .setRows(1);
            query.set("wt", "json");
            String jsonResponse;

            QueryRequest qreq = new QueryRequest(query);
            // qreq.setPath();
            NoOpResponseParser dontMessWithSolr = new NoOpResponseParser();
            dontMessWithSolr.setWriterType("json");
            solr.setParser(dontMessWithSolr);
            NamedList<Object> qresp = solr.request(qreq, "letters");
            jsonResponse = (String) qresp.get("response");
            ret = new JSONObject(jsonResponse);

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;
    }
    
    public static String hashString(String str) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            md.update(str.getBytes());
            byte[] digest = md.digest();
            return DatatypeConverter.printHexBinary(digest).toLowerCase();
        } catch (NoSuchAlgorithmException ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            return str;
        }
  }

    public static JSONObject saveLetter(String filename, JSONObject data ) {
        JSONObject ret = new JSONObject();
        try {
            String id = data.optString("id", null);
            if (id == null) {
                id = filename + new Date().getTime();
                data.put("id", id);
            }
            
            Http2SolrClient solr = (Http2SolrClient) getClient(); 
            SolrInputDocument idoc = new SolrInputDocument();
            idoc.setField("id", id);
            if (data.has("hiko_id")) {
                idoc.setField("hiko_id", data.getInt("hiko_id"));
            } else if (data.optJSONObject("hiko", new JSONObject()).has("id")) {
                idoc.setField("hiko_id", data.optJSONObject("hiko").getInt("id"));
            }
            idoc.setField("tenant", data.optString("tenant"));
            idoc.setField("filename", filename);
            idoc.setField("file_id", hashString(filename));
            idoc.setField("hiko", data.getJSONObject("hiko").toString());
            idoc.setField("ai", data.getJSONArray("ai").toString());
            idoc.setField("selection", data.getJSONArray("selection").toString());
            idoc.setField("startPage", data.optInt("startPage", 0));
            if (data.has("page_number")) {
                idoc.setField("page_number", data.getInt("page_number"));
            }
            idoc.setField("letter_number", data.optString("letter_number"));
            idoc.setField("author", data.optString("author"));
            idoc.setField("recipient", data.optString("recipient"));
            idoc.setField("origin", data.optString("origin"));
            idoc.setField("destination", data.optString("destination"));
            idoc.setField("date", data.optString("date"));  
            solr.add("letters", idoc);
            solr.commit("letters");
            ret.put("msg", "letter saved!");

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;
    }

    public static JSONObject checkAuthor(String name, String tenant, boolean extended) {
        JSONObject ret = new JSONObject();
        try {

            Http2SolrClient solr = (Http2SolrClient) getClient();
            SolrQuery query = new SolrQuery(name)
                    .setFields("id:table_id,name");
            query.set("qf", "name_lower^5 name^2 alternative_names");
            if (!tenant.isBlank()) {
                // query.set("bq", "tenant:"+tenant+"^10");
                query.addFilterQuery("tenant:"+tenant);
            }
            query.set("tie", "0.1");
            if (extended) {
                query.set("mm", "90%");
                query.setRows(20);
            } else {
                query.set("mm", "2<90%");
                query.setRows(10);
            }
            query.set("defType", "edismax");
            query.set("wt", "json");
            String jsonResponse;

            QueryRequest qreq = new QueryRequest(query);
            // qreq.setPath();
            NoOpResponseParser dontMessWithSolr = new NoOpResponseParser();
            dontMessWithSolr.setWriterType("json");
            solr.setParser(dontMessWithSolr);
            NamedList<Object> qresp = solr.request(qreq, "identities");
            jsonResponse = (String) qresp.get("response");
            ret = new JSONObject(jsonResponse);

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;
    }
    
    public static JSONObject getAuthors(String prefix, String tenant) {
        JSONObject ret = new JSONObject();
        try {

            Http2SolrClient solr = (Http2SolrClient) getClient();
            SolrQuery query = new SolrQuery("name_lower:" + prefix + "*")
                    .setFields("id,tenant,name")
                    .setSort(SolrQuery.SortClause.asc("name_sort"))
                    .setRows(10);
            if (!tenant.isBlank()) {
                query.addFilterQuery("tenant:"+tenant);
            }
            
            query.set("wt", "json");
            String jsonResponse;
            QueryRequest qreq = new QueryRequest(query);
            // qreq.setPath();
            NoOpResponseParser dontMessWithSolr = new NoOpResponseParser();
            dontMessWithSolr.setWriterType("json");
            solr.setParser(dontMessWithSolr);
            NamedList<Object> qresp = solr.request(qreq, "identities");
            jsonResponse = (String) qresp.get("response");
            ret = new JSONObject(jsonResponse);

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;
    }
    
    public static JSONObject getLocations(String prefix, String tenant, String type) {
        JSONObject ret = new JSONObject();
        try {

            Http2SolrClient solr = (Http2SolrClient) getClient();
            SolrQuery query = new SolrQuery("name_lower:" + prefix + "* OR acronyms:" + prefix + "*")
                    .setFields("id,tenant,name,type,acronyms")
                    .setRows(1000);
            if (!tenant.isBlank()) {
                query.addFilterQuery("tenant:"+tenant);
            }
            if (!type.isBlank()) {
                query.addFilterQuery("type:"+type);
            }
            
            query.set("wt", "json");
            String jsonResponse;

            QueryRequest qreq = new QueryRequest(query);
            // qreq.setPath();
            NoOpResponseParser dontMessWithSolr = new NoOpResponseParser();
            dontMessWithSolr.setWriterType("json");
            solr.setParser(dontMessWithSolr);
            NamedList<Object> qresp = solr.request(qreq, "locations");
            jsonResponse = (String) qresp.get("response");
            ret = new JSONObject(jsonResponse);

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;
    }
    
    public static JSONObject checkPlaces(String name, String tenant, boolean extended) {
        JSONObject ret = new JSONObject();
        try {

            Http2SolrClient solr = (Http2SolrClient) getClient();
            SolrQuery query = new SolrQuery()
                    .setFields("id:table_id,name");
            query.set("qf", "name_lower^5 name^2 alternative_names");
            if (!tenant.isBlank()) {
                // query.set("bq", "tenant:"+tenant+"^10");
                query.addFilterQuery("tenant:"+tenant);
            }
            query.set("tie", "0.1");
            if (extended) {
                query.setQuery(name + "*");
                query.set("mm", "90%");
                query.setRows(20);
            } else {
                query.setQuery(name);
                query.set("mm", "2<90%");
                query.setRows(10);
            }
            query.set("defType", "edismax");
            query.set("wt", "json");
            String jsonResponse;

            QueryRequest qreq = new QueryRequest(query);
            // qreq.setPath();
            NoOpResponseParser dontMessWithSolr = new NoOpResponseParser();
            dontMessWithSolr.setWriterType("json");
            solr.setParser(dontMessWithSolr);
            NamedList<Object> qresp = solr.request(qreq, "places");
            jsonResponse = (String) qresp.get("response");
            ret = new JSONObject(jsonResponse);

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;
    }
    
    
    public static JSONObject getPlaces(String tenant) {
        JSONObject ret = new JSONObject();
        try {

            Http2SolrClient solr = (Http2SolrClient) getClient();
            SolrQuery query = new SolrQuery("*")
                    .setRows(1000);
            if (tenant != null && !tenant.isBlank()) {
                query.addFilterQuery("tenant:"+tenant);
            }
            query.set("wt", "json");
            String jsonResponse;

            QueryRequest qreq = new QueryRequest(query);
            // qreq.setPath();
            NoOpResponseParser dontMessWithSolr = new NoOpResponseParser();
            dontMessWithSolr.setWriterType("json");
            solr.setParser(dontMessWithSolr);
            NamedList<Object> qresp = solr.request(qreq, "places");
            jsonResponse = (String) qresp.get("response");
            ret = new JSONObject(jsonResponse);

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;
    }
    
    public static JSONObject getLetterPlace(String tenant) {
        JSONObject ret = new JSONObject();
        try {

            Http2SolrClient solr = (Http2SolrClient) getClient();
            SolrQuery query = new SolrQuery("*")
                    .setRows(1000);
            if (tenant != null && !tenant.isBlank()) {
                query.addFilterQuery("tenant:"+tenant);
            }
            query.set("wt", "json");
            String jsonResponse;

            QueryRequest qreq = new QueryRequest(query);
            // qreq.setPath();
            NoOpResponseParser dontMessWithSolr = new NoOpResponseParser();
            dontMessWithSolr.setWriterType("json");
            solr.setParser(dontMessWithSolr);
            NamedList<Object> qresp = solr.request(qreq, "letter_place");
            jsonResponse = (String) qresp.get("response");
            ret = new JSONObject(jsonResponse);

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;
    }
    
    public static JSONObject saveLocation(JSONObject data) {
        JSONObject ret = new JSONObject();
        try {
            String id = data.optString("id", null);
            Http2SolrClient solr = (Http2SolrClient) getClient(); 
            SolrInputDocument idoc = new SolrInputDocument();
            idoc.setField("id", id);
            idoc.setField("name", data.optString("name"));
            idoc.setField("tenant", data.optString("tenant"));
            idoc.setField("type", data.optString("type"));
            JSONArray ja = data.optJSONArray("acronyms");
            for (int i = 0; i < ja.length(); i++) {
                idoc.addField("acronyms", ja.getString(i));
            }
            
            solr.add("locations", idoc);
            solr.commit("locations");
            ret.put("msg", "location saved!");

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;
    }

}
