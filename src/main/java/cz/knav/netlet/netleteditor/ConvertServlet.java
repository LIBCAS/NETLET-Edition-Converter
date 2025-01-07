package cz.inovatika.knav.netlet.netleteditor;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

/**
 *
 * @author alberto
 */
@WebServlet(name = "ConvertServlet", urlPatterns = {"/convert/*"})
public class ConvertServlet extends HttpServlet { 

    public static final Logger LOGGER = Logger.getLogger(ConvertServlet.class.getName());

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
        PrintWriter out = response.getWriter();
        try {
            String actionNameParam = request.getPathInfo().substring(1);
            if (actionNameParam != null) {
                Actions actionToDo = Actions.valueOf(actionNameParam.toUpperCase());
                JSONObject json = actionToDo.doPerform(request, response);
                out.println(json.toString(2));
            } else {
                out.print("actionNameParam -> " + actionNameParam);
            }
        } catch (IOException e1) {
            LOGGER.log(Level.SEVERE, e1.getMessage(), e1);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e1.toString());
            out.print(e1.toString());
        } catch (SecurityException e1) {
            LOGGER.log(Level.SEVERE, e1.getMessage(), e1);
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        } catch (Exception e1) {
            LOGGER.log(Level.SEVERE, e1.getMessage(), e1);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e1.toString());
            out.print(e1.toString());
        }
    }

    enum Actions {
        PDF {
            @Override
            JSONObject doPerform(HttpServletRequest req, HttpServletResponse response) throws Exception {
                String filename = req.getParameter("file");
                return PDFThumbsGenerator.processFile(filename);

            }
        },
        IMAGES {
            @Override
            JSONObject doPerform(HttpServletRequest req, HttpServletResponse response) throws Exception {
                String filename = req.getParameter("file");
                boolean overwrite = Boolean.parseBoolean(req.getParameter("overwrite"));
                return PDFThumbsGenerator.generateImages(filename, overwrite);

            }
        },
        ALTO_IMAGE {
            @Override
            JSONObject doPerform(HttpServletRequest req, HttpServletResponse response) throws Exception {
                String filename = req.getParameter("filename");
                String page = req.getParameter("page");
                String pdfDir = Storage.pdfDir(filename);
                return new JSONObject().put("result", PERORequester.generate(pdfDir, page));

            }
        },
        ALTO_IMAGE_FILE {
            @Override
            JSONObject doPerform(HttpServletRequest req, HttpServletResponse response) throws Exception {
                String imagePath = req.getParameter("file");
                String page = req.getParameter("page");
                String pdfDir = Storage.pdfsDir();
                String outputTxt = pdfDir + "test" + File.separator + page + ".txt";
                String outputAlto = pdfDir + "test" + File.separator + page + ".xml";
                return new JSONObject().put("result", PERORequester.generate(imagePath, outputTxt, outputAlto)); 

            }
        },
        ALTO {
            @Override
            JSONObject doPerform(HttpServletRequest req, HttpServletResponse response) throws Exception {
                String filename = req.getParameter("file");
                boolean overwrite = Boolean.parseBoolean(req.getParameter("overwrite"));
                return PDFThumbsGenerator.generateAlto(filename, overwrite, false);

            }
        },
        STOP_ALTO { 
            @Override
            JSONObject doPerform(HttpServletRequest req, HttpServletResponse response) throws Exception {
                return PDFThumbsGenerator.stop(false);
            }
        },
        CHECK {
            @Override
            JSONObject doPerform(HttpServletRequest req, HttpServletResponse response) throws Exception {
                return PDFThumbsGenerator.check(false);
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
