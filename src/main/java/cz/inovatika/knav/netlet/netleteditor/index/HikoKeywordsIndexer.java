/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package cz.inovatika.knav.netlet.netleteditor.index;

import cz.inovatika.knav.netlet.netleteditor.Options;
import java.io.File;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.common.SolrInputDocument;
import org.json.JSONObject;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.time.DurationFormatUtils;
import org.json.JSONArray;
import org.json.JSONException;

/**
 *
 * @author alberto
 */
public class HikoKeywordsIndexer {

    public static final Logger LOGGER = Logger.getLogger(HikoKeywordsIndexer.class.getName());
    SolrClient client;
    String slovnik = "hiko";

    private Connection conn;

    public Connection getConnection() throws NamingException, SQLException {
        if (conn == null || conn.isClosed()) {
            Context initContext = new InitialContext();
            Context envContext = (Context) initContext.lookup("java:/comp/env");
            DataSource ds = (DataSource) envContext.lookup("jdbc/hiko");
            conn = ds.getConnection();
        }
        return conn;
    }

    public static JSONObject fromJSON(File dir, SolrClient client) {

//id,created_at,updated_at,name,keyword_category_id
//1,"2022-05-16 02:47:34","2022-05-16 02:47:34","{"cs": "Absolutismus", "en": "Absolutism"}",509
        JSONObject ret = new JSONObject();
        int success = 0;
        int errors = 0;
        try {
            Date start = new Date();
            JSONArray ja = new JSONArray();
            ret.put("errors msgs", ja);

            for (File file : dir.listFiles()) {
                if (!file.isDirectory()) {
                    LOGGER.log(Level.INFO, "indexing from {0}", file.getName());
                    // Reader in = new FileReader(file);

                    JSONArray records = new JSONArray(FileUtils.readFileToString(file, "UTF8"));

                    Date tstart = new Date();
                    int tsuccess = 0;
                    int terrors = 0;
                    JSONObject typeJson = new JSONObject();

                    for (int i = 0; i < records.length(); i++) {
                        try {
                            JSONObject record = records.getJSONObject(i);
                            SolrInputDocument doc = new SolrInputDocument();

                            doc.addField("id", file.getName() + "_" + record.getInt("id"));
                            doc.addField("dict", "hiko");
                            JSONObject name = new JSONObject(record.getString("name"));
                            doc.addField("key_cze", name.getString("cs"));
                            doc.addField("key_tagger_cze", name.getString("cs"));
                            doc.addField("key_eng", name.getString("en"));
                            doc.addField("key_tagger_eng", name.getString("en"));

                            client.add("dictionaries", doc);
                            tsuccess++;
                            success++;
                            if (success % 500 == 0) {
                                client.commit("dictionaries");
                                LOGGER.log(Level.INFO, "Indexed {0} docs", success);
                            }
                        } catch (Exception ex) {
                            terrors++;
                            errors++;
                            // ret.getJSONArray("errors msgs").put(record);
                            LOGGER.log(Level.SEVERE, "Error indexing line {0}", i);
                            LOGGER.log(Level.SEVERE, null, ex);
                        }
                    }

                    client.commit("dictionaries");

                    typeJson.put("docs indexed", tsuccess).put("errors", terrors);
                    Date tend = new Date();

                    typeJson.put("ellapsed time", DurationFormatUtils.formatDuration(tend.getTime() - tstart.getTime(), "HH:mm:ss.S"));
                    ret.put(file.getName(), typeJson).put("docs indexed", success);

                }
            }
            LOGGER.log(Level.INFO, "Indexed Finished. {0} success, {1} errors", new Object[]{success, errors});

            ret.put("errors", errors);

            Date end = new Date();
            ret.put("ellapsed time", DurationFormatUtils.formatDuration(end.getTime() - start.getTime(), "HH:mm:ss.S"));
        } catch (IOException | SolrServerException ex) {
            LOGGER.log(Level.SEVERE, null, ex);
        }
        return new JSONObject().put("translations", ret);
    }

    public List<String> getTenants() {
        List<String> ret = new ArrayList();
        try {
            PreparedStatement ps = getConnection().prepareStatement("select table_prefix from tenants");
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ret.add(rs.getString("table_prefix"));
                }
                rs.close();
            }
            ps.close();
        } catch (NamingException | SQLException ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.add("error");
        }

        return ret;
    }

    private List<String> getTables() {
        List<String> ret = new ArrayList();
        List<String> tenants = getTenants();
        List<Object> keys = Options.getInstance().getJSONArray("dbKeywordTables").toList();
        for (String t : tenants) {
            for (Object k : keys) {
                ret.add(t + "__" + k);
            }
        }

        return ret;
    }

    public JSONObject full() {
        Date start = new Date();
        JSONObject ret = new JSONObject();
        int tindexed = 0;
        int success = 0;
        try {
            client = Indexer.getClient();
            List<String> names = getTables();
            for (String t : names) {
                PreparedStatement ps = getConnection().prepareStatement("select * from " + t);
                try (ResultSet rs = ps.executeQuery()) {
                    tindexed = 0;
                    while (rs.next()) {
                        JSONObject name = new JSONObject(rs.getString("name"));

                        SolrInputDocument doc = new SolrInputDocument();

                        doc.addField("id", t + "_" + rs.getInt("id"));
                        doc.addField("dict", "hiko");
                        doc.addField("table", t);
                        doc.addField("table_id", rs.getInt("id"));
                        doc.addField("type", t.split("__")[1]);
                        doc.addField("tenant", t.split("__")[0]);
                        doc.addField("key_cze", name.optString("cs"));
                        doc.addField("key_tagger_cze", name.optString("cs"));
                        doc.addField("key_eng", name.optString("en"));
                        doc.addField("key_tagger_eng", name.optString("en"));

                        client.add("dictionaries", doc);
                        success++;
                        if (success % 500 == 0) {
                            client.commit("dictionaries");
                            LOGGER.log(Level.INFO, "Indexed {0} docs", success);
                        }

                        ret.put(t, tindexed++);

                    }
                    rs.close();
                } catch (Exception e) {
                    LOGGER.log(Level.SEVERE, null, e);
                    ret.put("error" + t, e);
                }
                ps.close();
            }
        } catch (NamingException | SQLException ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        Date end = new Date();
        ret.put("ellapsed time", DurationFormatUtils.formatDuration(end.getTime() - start.getTime(), "HH:mm:ss.S"));
        ret.put("total", success);
        return ret;
    }
    
    public JSONObject identities() {
        Date start = new Date();
        JSONObject ret = new JSONObject();
        int tindexed = 0;
        int success = 0;
        try {
            client = Indexer.getClient();
            List<String> tenants = getTenants();
            
        
            for (String tenant : tenants) {
                String t = tenant + "__identities";
                PreparedStatement ps = getConnection().prepareStatement("select * from " + t);
                try (ResultSet rs = ps.executeQuery()) {
                    tindexed = 0;
                    while (rs.next()) {

                        SolrInputDocument doc = new SolrInputDocument();
                        
                        String id = tenant + "_" + rs.getInt("id");

                        doc.addField("id", id);
                        doc.addField("table", t);
                        doc.addField("table_id", rs.getInt("id"));
                        doc.addField("tenant", tenant);
                        doc.addField("name", rs.getString("name"));
                        doc.addField("surname", rs.getString("surname"));
                        doc.addField("forename", rs.getString("forename"));
                        String an = rs.getString("alternative_names");
                        if (an != null) {
                            try {
                            JSONObject anjs = new JSONObject(an);
                            for( String key: anjs.keySet()) {
                                doc.addField("alternative_names", anjs.getString(key));
                            }
                            } catch (JSONException jsonex) {
                                LOGGER.log(Level.WARNING, "Invalid JSON for {0}", id);
                            }
                            
                        }
                        
                        doc.addField("type", rs.getString("type"));

                        client.add("identities", doc);
                        success++;
                        if (success % 500 == 0) {
                            client.commit("identities");
                            LOGGER.log(Level.INFO, "Indexed {0} docs", success);
                        }

                        ret.put(t, tindexed++);

                    }
                    rs.close();
                } catch (Exception e) {
                    LOGGER.log(Level.SEVERE, null, e);
                    ret.put("error" + t, e);
                }
                ps.close();
            }
        } catch (NamingException | SQLException ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        Date end = new Date();
        ret.put("ellapsed time", DurationFormatUtils.formatDuration(end.getTime() - start.getTime(), "HH:mm:ss.S"));
        ret.put("total", success);
        return ret;
    }

}
