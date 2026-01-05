
package cz.knav.netlet.netleteditor;

import static cz.knav.netlet.netleteditor.index.HikoIndexer.LOGGER;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.logging.Level;
import org.apache.commons.io.IOUtils;
import org.json.JSONObject;

/**
 *
 * @author alber
 */
public class LoginController {
    
    public static JSONObject getUser(HttpServletRequest request) {
        HttpSession session = request.getSession();
        if (session == null || session.getAttribute("user") == null) {
            return null;
        } else {
            return (JSONObject)session.getAttribute("user");
        }
    }
    
    public static String getUserToken(HttpServletRequest request) {
        HttpSession session = request.getSession();
        if (session == null || session.getAttribute("token") == null) {
            return null;
        } else {
            return (String)session.getAttribute("token");
        }
    }
    
    
    public static JSONObject login(HttpServletRequest request) {
        JSONObject ret = new JSONObject();
        String t = request.getParameter("tenant");
        if (Options.getInstance().getJSONObject("hiko").optBoolean("isECTest", true)) { 
            t = Options.getInstance().getJSONObject("hiko").getJSONObject("test_mappings").getString(t);
        }
        String url = Options.getInstance().getJSONObject("hiko").getString("api")
                .replace("{tenant}", t)
                + "/login";
        System.out.println(url);
        try (HttpClient httpclient = HttpClient
                .newBuilder()
                .build()) {
            String d = IOUtils.toString(request.getInputStream(), "UTF-8");
//            String d = new JSONObject()
//                    .put("email", request.getParameter("email"))
//                    .put("password", request.getParameter("password")).toString();
            HttpRequest hrequest = HttpRequest.newBuilder()
                        .uri(new URI(url))  
                        .header("Accept", "application/json")
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(d))
                        .build();

            HttpResponse<String> response = httpclient.send(hrequest, HttpResponse.BodyHandlers.ofString());
            JSONObject j = new JSONObject(response.body());
            
            j.put("tenant", request.getParameter("tenant"));
            HttpSession session = request.getSession();
            session.setAttribute("user", j);
            session.setAttribute("token", j.getJSONObject("data").getString("token"));
            ret = j.getJSONObject("data").getJSONObject("user");
        } catch (URISyntaxException | IOException | InterruptedException ex) {
            ret.put("error", ex.toString());
            LOGGER.log(Level.SEVERE, null, ex);
        }

        
        return ret;
    }
    
    public static JSONObject logout(HttpServletRequest request) {
        JSONObject ret = new JSONObject();
        request.getSession().invalidate();
        return ret;
    }
    
}
