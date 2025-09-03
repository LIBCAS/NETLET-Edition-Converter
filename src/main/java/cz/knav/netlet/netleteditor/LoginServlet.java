package cz.knav.netlet.netleteditor;

import cz.knav.netlet.netleteditor.index.Indexer;
import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author alber
 */
@WebServlet(name = "LoginServlet", urlPatterns = {"/user/*"})
public class LoginServlet extends HttpServlet {

    public static final Logger LOGGER = Logger.getLogger(LoginServlet.class.getName());

    /**
     * Processes requests for both HTTP <code>GET</code> and <code>POST</code>
     * methods.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1
        response.setHeader("Pragma", "no-cache"); // HTTP 1.0
        response.setDateHeader("Expires", 0); // Proxies.
        response.setHeader("Connection", "keep-alive");
        try {
            String actionNameParam = request.getPathInfo().substring(1);
            if (actionNameParam != null) {
                Actions actionToDo = Actions.valueOf(actionNameParam.toUpperCase());
                JSONObject json = actionToDo.doPerform(request, response);
                if (json != null) {
                    response.getWriter().println(json.toString(2));
                }

            } else {
                response.getWriter().print("actionNameParam -> " + actionNameParam);
            }
        } catch (IOException e1) {
            LOGGER.log(Level.SEVERE, e1.getMessage(), e1);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e1.toString());
            response.getWriter().print(e1.toString());
        } catch (SecurityException e1) {
            LOGGER.log(Level.SEVERE, e1.getMessage(), e1);
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        } catch (Exception e1) {
            LOGGER.log(Level.SEVERE, e1.getMessage(), e1);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e1.toString());
            response.getWriter().print(e1.toString());
        }
    }

    enum Actions {
        INIT {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                JSONObject user = LoginController.getUser(request);
                Set<String> tenants = Options.getInstance().getJSONObject("hiko").getJSONObject("test_mappings").keySet();
                ret.put("tenants", tenants);
                ret.put("user", user);
                ret.put("gptModels", Options.getInstance().getJSONArray("gptModels"));
                return ret;
            }
        },
        
        DOCUMENTS {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                JSONObject user = LoginController.getUser(request);
                ret.put("user", user);
                String utenant = "";
                if (user != null) {
                    utenant = user.optString("tenant");
                }
                utenant = "brezina";
                ret.put("tenants", Indexer.getTenants().getJSONObject("facet_counts").getJSONObject("facet_fields").getJSONObject("tenant"));
                ret.put("totals", Indexer.getLettersTotals().getJSONObject("facet_counts").getJSONObject("facet_fields").getJSONObject("filename")); 

                JSONArray fs = PDFThumbsGenerator.getDocuments().getJSONArray(("dirs"));
                for (int i = 0; i < fs.length(); i++) {
                    String tenant = fs.getJSONObject(i).getJSONObject("config").getString("tenant");
                    if (utenant == null || utenant.equals(tenant)) {
                        ret.append("dirs", fs.getJSONObject(i));
                    }
                }
                ret.put("gptModels", Options.getInstance().getJSONArray("gptModels"));
                return ret;
            }
        },
        LOGIN {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                HttpSession session = request.getSession();
                if (request.getParameter("JSESSIONID") != null) {
                    Cookie userCookie = new Cookie("JSESSIONID", request.getParameter("JSESSIONID"));
                    response.addCookie(userCookie);
                } else {
                    String sessionId = session.getId();
                    Cookie userCookie = new Cookie("JSESSIONID", sessionId);
                    response.addCookie(userCookie);
                }
                return LoginController.login(request);
            }
        },
        LOGOUT {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                return LoginController.logout(request);
            }
        };

        abstract JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception;
    }

    // <editor-fold defaultstate="collapsed" desc="HttpServlet methods. Click on the + sign on the left to edit the code.">
    /**
     * Handles the HTTP <code>GET</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    /**
     * Handles the HTTP <code>POST</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    /**
     * Returns a short description of the servlet.
     *
     * @return a String containing servlet description
     */
    @Override
    public String getServletInfo() {
        return "Short description";
    }// </editor-fold>

}
