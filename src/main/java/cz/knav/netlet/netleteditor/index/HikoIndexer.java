package cz.knav.netlet.netleteditor.index;

import cz.knav.netlet.netleteditor.Options;
import static cz.knav.netlet.netleteditor.index.HikoKeywordsIndexer.LOGGER;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Date;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.commons.lang3.time.DurationFormatUtils;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.Http2SolrClient;
import org.apache.solr.common.SolrInputDocument;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 *
 * @author alber
 */
public class HikoIndexer {

    public static final Logger LOGGER = Logger.getLogger(HikoIndexer.class.getName());

    public JSONObject saveLetter(String data, String tenant, String token) {
        Date start = new Date();
        JSONObject ret = new JSONObject();
        LOGGER.log(Level.INFO, "Saving letter in hiko");
        String t = tenant;
        if (Options.getInstance().getJSONObject("hiko").optBoolean("isECTest", true)) {
            t = Options.getInstance().getJSONObject("hiko").getJSONObject("test_mappings").getString(tenant);
        }
        String url = Options.getInstance().getJSONObject("hiko").getString("api")
                .replace("{tenant}", t)
                + "/letter";

        String id = new JSONObject(data).optString("id", "");
        try (HttpClient httpclient = HttpClient
                .newBuilder()
                .build()) {
            HttpRequest request;
            if (!id.isBlank()) {
                url += "/" + id;
                LOGGER.log(Level.INFO, "Save letter tenant {0} -> {1}", new Object[]{tenant, url});
                request = HttpRequest.newBuilder()
                        .uri(new URI(url))
                        .header("Authorization", "Bearer " + token)
                        .header("Accept", "application/json")
                        .header("Content-Type", "application/json")
                        .PUT(HttpRequest.BodyPublishers.ofString(data))
                        .build();
            } else {
                url += "s";
                LOGGER.log(Level.INFO, "Save letter tenant {0} -> {1}", new Object[]{tenant, url});
                request = HttpRequest.newBuilder()
                        .uri(new URI(url))
                        .header("Authorization", "Bearer " + token)
                        .header("Accept", "application/json")
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(data))
                        .build();
            }

            HttpResponse<String> response = httpclient.send(request, HttpResponse.BodyHandlers.ofString());
            ret = new JSONObject(response.body());
        } catch (URISyntaxException | IOException | InterruptedException ex) {
            LOGGER.log(Level.SEVERE, null, ex);
        }

        Date end = new Date();
        ret.put("ellapsed time", DurationFormatUtils.formatDuration(end.getTime() - start.getTime(), "HH:mm:ss.S"));
        LOGGER.log(Level.INFO, "Letter Saved!");
        return ret;
    }

    public JSONObject indexIdentities() throws URISyntaxException, IOException, InterruptedException {
        Date start = new Date();
        JSONObject ret = new JSONObject();
        LOGGER.log(Level.INFO, "Indexing HIKO identities");
        try (SolrClient client = new Http2SolrClient.Builder(Options.getInstance().getString("solr")).build()) {
            Set<String> tenants = Options.getInstance().getJSONObject("hiko").getJSONObject("test_mappings").keySet();
            for (String tenant : tenants) {
                indexTenantIdentities(client, ret, tenant);
            }

            client.commit("identities");
        } catch (URISyntaxException | InterruptedException | IOException | SolrServerException ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        Date end = new Date();
        ret.put("ellapsed time", DurationFormatUtils.formatDuration(end.getTime() - start.getTime(), "HH:mm:ss.S"));
        LOGGER.log(Level.INFO, "Indexing HIKO identities FINISHED");
        return ret;

    }

    private void indexTenantIdentities(SolrClient client, JSONObject ret, String tenant) throws URISyntaxException, IOException, InterruptedException, SolrServerException {
        String t = tenant;
        if (Options.getInstance().getJSONObject("hiko").optBoolean("isECTest", true)) {
            t = Options.getInstance().getJSONObject("hiko").getJSONObject("test_mappings").getString(tenant);
        }
        String url = Options.getInstance().getJSONObject("hiko").getString("api")
                .replace("{tenant}", t)
                + "/identities?per_page=100";
        int tindexed = 0;
        LOGGER.log(Level.INFO, "Indexing tenant {0} -> {1}", new Object[]{tenant, url});
        try (HttpClient httpclient = HttpClient
                .newBuilder()
                .build()) {
            while (url != null) {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(new URI(url))
                        .header("Authorization", Options.getInstance().getJSONObject("hiko").getString("bearer"))
                        .header("Accept", "application/json")
                        .GET()
                        .build();
                HttpResponse<String> response = httpclient.send(request, HttpResponse.BodyHandlers.ofString());
                JSONObject resp = new JSONObject(response.body());
                JSONArray docs = resp.getJSONArray("data");
                for (int i = 0; i < docs.length(); i++) {
                    JSONObject rs = docs.getJSONObject(i);

                    SolrInputDocument doc = new SolrInputDocument();

                    String id = tenant + "_" + rs.getInt("id");

                    doc.addField("id", id);
                    doc.addField("table_id", rs.getInt("id"));
                    doc.addField("tenant", tenant);
                    doc.addField("name", rs.optString("name"));
                    doc.addField("surname", rs.optString("surname"));
                    doc.addField("forename", rs.optString("forename"));
                    String an = rs.optString("alternative_names", null);
                    if (an != null) {
                        try {
                            JSONObject anjs = new JSONObject(an);
                            for (String key : anjs.keySet()) {
                                doc.addField("alternative_names", anjs.getString(key));
                            }
                        } catch (JSONException jsonex) {
                            LOGGER.log(Level.WARNING, "Invalid JSON for {0}", id);
                        }
                    }

                    doc.addField("type", rs.getString("type"));
                    client.add("identities", doc);
                    ret.put(tenant, tindexed++);
                    if (tindexed % 500 == 0) {
                        client.commit("identities");
                        LOGGER.log(Level.INFO, "Tenant {0} -> {1} docs", new Object[]{tenant, tindexed});
                    }

                }
                url = resp.optString("next_page_url", null);
                Thread.sleep(1000);
            }
        }
    }

    public JSONObject indexPlaces() throws URISyntaxException, IOException, InterruptedException {
        Date start = new Date();
        JSONObject ret = new JSONObject();
        LOGGER.log(Level.INFO, "Indexing HIKO places");
        try (SolrClient client = new Http2SolrClient.Builder(Options.getInstance().getString("solr")).build()) {
            Set<String> tenants = Options.getInstance().getJSONObject("hiko").getJSONObject("test_mappings").keySet();
            for (String tenant : tenants) {
                indexTenantPlaces(client, ret, tenant);
            }

            client.commit("places");
        } catch (URISyntaxException | InterruptedException | IOException | SolrServerException ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        Date end = new Date();
        ret.put("ellapsed time", DurationFormatUtils.formatDuration(end.getTime() - start.getTime(), "HH:mm:ss.S"));
        LOGGER.log(Level.INFO, "Indexing HIKO places FINISHED");
        return ret;

    }

    private void indexTenantPlaces(SolrClient client, JSONObject ret, String tenant) throws URISyntaxException, IOException, InterruptedException, SolrServerException {
        String t = tenant;
        if (Options.getInstance().getJSONObject("hiko").optBoolean("isECTest", true)) {
            t = Options.getInstance().getJSONObject("hiko").getJSONObject("test_mappings").getString(tenant);
        }
        String url = Options.getInstance().getJSONObject("hiko").getString("api")
                .replace("{tenant}", t)
                + "/places?per_page=100";
        int tindexed = 0;
        LOGGER.log(Level.INFO, "Indexing tenant {0} -> {1}", new Object[]{tenant, url});
        try (HttpClient httpclient = HttpClient
                .newBuilder()
                .build()) {
            while (url != null) {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(new URI(url))
                        .header("Authorization", Options.getInstance().getJSONObject("hiko").getString("bearer"))
                        .header("Accept", "application/json")
                        .GET()
                        .build();
                HttpResponse<String> response = httpclient.send(request, HttpResponse.BodyHandlers.ofString());
                JSONObject resp = new JSONObject(response.body());
                JSONArray docs = resp.getJSONArray("data");
                for (int i = 0; i < docs.length(); i++) {
                    JSONObject rs = docs.getJSONObject(i);

                    SolrInputDocument doc = new SolrInputDocument();

                    String id = tenant + "_" + rs.getInt("id");

                    doc.addField("id", id);
                    doc.addField("table", t);
                    doc.addField("table_id", rs.getInt("id"));
                    doc.addField("tenant", tenant);
                    doc.addField("name", rs.getString("name"));
                    doc.addField("country", rs.optString("country"));
                    doc.addField("note", rs.optString("note"));
                    doc.addField("latitude", rs.optFloat("latitude"));
                    doc.addField("longitude", rs.optFloat("longitude"));
                    doc.addField("geoname_id", rs.optInt("geoname_id"));
                    doc.addField("division", rs.optString("division"));
                    if (!Float.isNaN(rs.optFloat("latitude"))) {
                        doc.addField("coords", rs.optFloat("latitude") + "," + rs.optFloat("longitude"));
                    }

                    JSONArray an = rs.optJSONArray("alternative_names");
                    if (an != null) {
                        for (int j = 0; j < an.length(); j++) {
                            doc.addField("alternative_names", an.getString(j));
                        }
                    }

                    client.add("places", doc);
                    ret.put(tenant, tindexed++);
                    if (tindexed % 500 == 0) {
                        client.commit("places");
                        LOGGER.log(Level.INFO, "Tenant {0} -> {1} docs", new Object[]{tenant, tindexed});
                    }

                }
                url = resp.optString("next_page_url", null);
                Thread.sleep(1000);
            }
        } catch (Exception ex) {
            ret.put(tenant, ex.toString());
            LOGGER.log(Level.SEVERE, "Error in tenant {0} -> {1}", new Object[]{tenant, ex.toString()});
        }
    }

    public JSONObject indexLocations() throws URISyntaxException, IOException, InterruptedException {
        Date start = new Date();
        JSONObject ret = new JSONObject();
        LOGGER.log(Level.INFO, "Indexing HIKO locations");
        try (SolrClient client = new Http2SolrClient.Builder(Options.getInstance().getString("solr")).build()) {
            Set<String> tenants = Options.getInstance().getJSONObject("hiko").getJSONObject("test_mappings").keySet();
            for (String tenant : tenants) {
                indexTenantLocations(client, ret, tenant);
            }

            client.commit("locations");
        } catch (URISyntaxException | InterruptedException | IOException | SolrServerException ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        Date end = new Date();
        ret.put("ellapsed time", DurationFormatUtils.formatDuration(end.getTime() - start.getTime(), "HH:mm:ss.S"));
        LOGGER.log(Level.INFO, "Indexing HIKO locations FINISHED");
        return ret;

    }

    private void indexTenantLocations(SolrClient client, JSONObject ret, String tenant) throws URISyntaxException, IOException, InterruptedException, SolrServerException {
        String t = tenant;
        if (Options.getInstance().getJSONObject("hiko").optBoolean("isECTest", true)) {
            t = Options.getInstance().getJSONObject("hiko").getJSONObject("test_mappings").getString(tenant);
        }
        String url = Options.getInstance().getJSONObject("hiko").getString("api")
                .replace("{tenant}", t)
                + "/locations?per_page=100";
        int tindexed = 0;
        LOGGER.log(Level.INFO, "Indexing tenant {0} -> {1}", new Object[]{tenant, url});
        try (HttpClient httpclient = HttpClient
                .newBuilder()
                .build()) {
            while (url != null) {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(new URI(url))
                        .header("Authorization", Options.getInstance().getJSONObject("hiko").getString("bearer"))
                        .header("Accept", "application/json")
                        .GET()
                        .build();
                HttpResponse<String> response = httpclient.send(request, HttpResponse.BodyHandlers.ofString());
                JSONObject resp = new JSONObject(response.body());
                JSONArray docs = resp.getJSONArray("data");
                for (int i = 0; i < docs.length(); i++) {
                    JSONObject rs = docs.getJSONObject(i);

                    SolrInputDocument doc = new SolrInputDocument();

                    String id = tenant + "_" + rs.getInt("id");

                    doc.addField("id", id);
                    doc.addField("table", t);
                    doc.addField("table_id", rs.getInt("id"));
                    doc.addField("tenant", tenant);
                    doc.addField("name", rs.getString("name"));
                    doc.addField("type", rs.optString("type"));
                    client.add("locations", doc);
                    ret.put(tenant, tindexed++);
                    if (tindexed % 500 == 0) {
                        client.commit("locations");
                        LOGGER.log(Level.INFO, "Tenant {0} -> {1} docs", new Object[]{tenant, tindexed});
                    }

                }
                url = resp.optString("next_page_url", null);
                Thread.sleep(1000);
            }
            client.commit("locations");
            LOGGER.log(Level.INFO, "Tenant {0} -> {1} docs", new Object[]{tenant, tindexed});
        }
    }
}
