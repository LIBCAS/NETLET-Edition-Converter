/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package cz.knav.netlet.netleteditor.index;

import cz.knav.netlet.netleteditor.Options;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.nio.charset.Charset;
import java.util.Date;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.commons.csv.CSVFormat; 
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.common.SolrInputDocument;
import org.json.JSONObject;
import org.apache.commons.lang3.time.DurationFormatUtils;
import org.json.JSONArray;

/**
 *
 * @author alberto
 */
public class GeoNamesIndexer {

    public static final Logger LOGGER = Logger.getLogger(HikoKeywordsIndexer.class.getName());

    public static JSONObject index(SolrClient client) {
        JSONObject ret = new JSONObject();

        ret.put("countries", indexCountries(client));
        //ret.put("cities", indexCities(client));

        return ret;
    }

    public static JSONObject indexCountries(SolrClient client) {

        File file = new File(Options.getInstance().getString("geo_dir") + File.separator + "CIS1186_CS.csv");
        JSONObject ret = new JSONObject();
        int success = 0;
        int errors = 0;
        try {
            Date start = new Date();
            JSONArray ja = new JSONArray();
            ret.put("errors msgs", ja);

            LOGGER.log(Level.INFO, "indexing from {0}", file.getName());
            Reader in = new FileReader(file, Charset.forName("UTF8") );

            CSVFormat f = CSVFormat.Builder.create(CSVFormat.DEFAULT)
                    .setHeader().build();
            CSVParser parser = new CSVParser(in, f);

            Date tstart = new Date();
            int tsuccess = 0;
            int terrors = 0;
            JSONObject typeJson = new JSONObject();

            for (final CSVRecord record : parser) {
                try {
                    SolrInputDocument doc = new SolrInputDocument();

                    doc.addField("id", "geo_country_" + record.get("chodnota"));

                    doc.addField("dict", "geo");
                    String name = record.get("zkrtext");
                    doc.addField("key_cze", name);
                    doc.addField("key_tagger_cze", name);
                    doc.addField("key_eng", name);
                    doc.addField("key_tagger_eng", name);

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
                    ret.getJSONArray("errors msgs").put(record);
                    LOGGER.log(Level.SEVERE, "Error indexing doc {0}", record);
                    LOGGER.log(Level.SEVERE, null, ex);
                }
            }

            client.commit("dictionaries");

            typeJson.put("docs indexed", tsuccess).put("errors", terrors);
            Date tend = new Date();

            typeJson.put("ellapsed time", DurationFormatUtils.formatDuration(tend.getTime() - tstart.getTime(), "HH:mm:ss.S"));
            ret.put(file.getName(), typeJson).put("docs indexed", success);

            LOGGER.log(Level.INFO, "Indexed Finished. {0} success, {1} errors", new Object[]{success, errors});

            ret.put("errors", errors);

            Date end = new Date();
            ret.put("ellapsed time", DurationFormatUtils.formatDuration(end.getTime() - start.getTime(), "HH:mm:ss.S"));
        } catch (IOException | SolrServerException ex) {
            LOGGER.log(Level.SEVERE, null, ex);
        }
        return new JSONObject().put("translations", ret);
    }

    public static JSONObject indexCities(SolrClient client) {
        JSONObject ret = new JSONObject();
        int success = 0;
        int errors = 0;
        try {
            File file = new File(Options.getInstance().getString("geo_dir") + File.separator + "cities1000.txt");
            Date start = new Date();
            JSONArray ja = new JSONArray();
            ret.put("errors msgs", ja);

            LOGGER.log(Level.INFO, "indexing from {0}", file.getName());
            Reader in = new FileReader(file);

            CSVParser parser = new CSVParser(in, CSVFormat.MONGODB_TSV);

            Date tstart = new Date();
            int tsuccess = 0;
            int terrors = 0;
            JSONObject typeJson = new JSONObject();

            for (final CSVRecord record : parser) {
                try {
                    SolrInputDocument doc = new SolrInputDocument();

                    doc.addField("id", "geo_" + record.get(0));

                    doc.addField("dict", "geo");
                    doc.addField("key_cze", record.get(1));
                    doc.addField("key_tagger_cze", record.get(1));
                    doc.addField("key_eng", record.get(1));
                    doc.addField("key_tagger_eng", record.get(1));

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
                    ret.getJSONArray("errors msgs").put(record);
                    LOGGER.log(Level.SEVERE, "Error indexing doc {0}", record);
                    LOGGER.log(Level.SEVERE, null, ex);
                }
            }

            client.commit("dictionaries");

            typeJson.put("docs indexed", tsuccess).put("errors", terrors);
            Date tend = new Date();

            typeJson.put("ellapsed time", DurationFormatUtils.formatDuration(tend.getTime() - tstart.getTime(), "HH:mm:ss.S"));
            ret.put(file.getName(), typeJson).put("docs indexed", success);

            LOGGER.log(Level.INFO, "Indexed Finished. {0} success, {1} errors", new Object[]{success, errors});

            ret.put("errors", errors);

            Date end = new Date();
            ret.put("ellapsed time", DurationFormatUtils.formatDuration(end.getTime() - start.getTime(), "HH:mm:ss.S"));
        } catch (IOException | SolrServerException ex) {
            LOGGER.log(Level.SEVERE, null, ex);
        }
        return new JSONObject().put("translations", ret);
    }

}
