package cz.knav.netlet.netleteditor.index;

import cz.knav.netlet.netleteditor.Options;
import java.io.IOException;
import java.net.URISyntaxException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.json.JSONObject;

/**
 *
 * @author alber
 */
public class DbIndexer {

    private static Logger LOGGER = Logger.getLogger(DbIndexer.class.getName());
    private static Connection conn;

    public static Connection getConnection() throws NamingException, SQLException {
        if (conn == null || conn.isClosed()) {
            Context initContext = new InitialContext();
            Context envContext = (Context) initContext.lookup("java:/comp/env");
            DataSource ds = (DataSource) envContext.lookup("jdbc/hiko");
            conn = ds.getConnection();
        }
        return conn;
    }

    public static List<String> getTenants() {
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

    private static List<String> getTables() {
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

    public static JSONObject full() {
        JSONObject ret = new JSONObject();
        try {
            List<String> names = getTables();

            for (String t : names) {
                PreparedStatement ps = getConnection().prepareStatement("select * from " + t );
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        ret.append("tgm__professions", new JSONObject(rs.getString("name")));
                    }
                    rs.close();
                } catch(Exception e) {
                    LOGGER.log(Level.SEVERE, null, e);
                    ret.put("error" + t, e);
                }
                ps.close();
            }
        } catch (NamingException | SQLException ex) {
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }

        return ret;
    }
    
    private static JSONObject doRequest(String url) throws IOException {
        HttpClient httpClient = HttpClients.createDefault();
        HttpGet httpGet = new HttpGet(url);
        httpGet.addHeader("Authorization", "Bearer " + Options.getInstance().getJSONObject("hiko").getString("bearer"));
        HttpResponse response = httpClient.execute(httpGet);
        if (response.getStatusLine().getStatusCode() == 200) {
            return new JSONObject(EntityUtils.toString(response.getEntity()));
        } else if (response.getStatusLine().getStatusCode() == 404) {
            return new JSONObject().put("error", "id_not_exists");
        } else {
            LOGGER.log(Level.WARNING, "Status code: {0)", response.getStatusLine().getStatusCode());
            throw new IOException("Unexpected code " + response.getStatusLine().getStatusCode());
        }
    }
    
    public static JSONObject getLettersFromHIKO(String tenant) throws IOException {
        JSONObject config = Options.getInstance().getJSONObject("hiko");
        String url = "https://" + config.getJSONObject("test_mappings").getString(tenant) + config.getString("api_point") + "letters";
        return doRequest(url);
    }
    
    public static JSONObject getLetterFromHIKO(String tenant, String id) throws IOException {
        JSONObject config = Options.getInstance().getJSONObject("hiko");
        String url = "https://" + config.getJSONObject("test_mappings").getString(tenant) + config.getString("api_point") + "letter/" + id;
        return doRequest(url);
    }
    
    public static JSONObject addLetterFromHIKO(String tenant, String id) throws IOException {
        JSONObject config = Options.getInstance().getJSONObject("hiko");
        String url = "https://" + config.getJSONObject("test_mappings").getString(tenant) + config.getString("api_point") + "letter/" + id;
        return doRequest(url);
    }

}
