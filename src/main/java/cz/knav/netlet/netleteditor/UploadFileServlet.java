package cz.knav.netlet.netleteditor;

import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import java.io.File;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.json.JSONObject;

/**
 *
 * @author alber
 */
@WebServlet(name = "UploadFileServlet", urlPatterns = {"/upload"})
@MultipartConfig(location = "/tmp", fileSizeThreshold = 1024 * 1024)
public class UploadFileServlet extends HttpServlet {

    public static final Logger LOGGER = Logger.getLogger(UploadFileServlet.class.getName());

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
        try {
            JSONObject json = doUpload(request, response);
            response.getWriter().println(json.toString(2));
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

    private JSONObject doUpload(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
        JSONObject ret = new JSONObject();
        for (Part part : request.getParts()) {
            // fileName = getFileName(part);
            String subbmittedFilename = part.getSubmittedFileName();

            String pdfDir = Storage.pdfDir(subbmittedFilename);

            File uploadDir = new File(pdfDir);
            if (!uploadDir.exists()) {
                uploadDir.mkdir();
            }

            String fileName = pdfDir + File.separator + subbmittedFilename;

            File uploadedFile = new File(fileName);
            if (uploadedFile.exists()) {
                try {
                    boolean deleted = uploadedFile.delete();
                    if (!deleted) {
                        return ret.put("error", "Can't delete file");
                    }
                } catch (Exception ioex) {
                    LOGGER.log(Level.SEVERE, null, ioex);
                    return ret.put("error", "Can't delete file");
                }
            }
            part.write(fileName);
//            File f2 = new File(fileName);
//            if (f2.exists()) {
//                new Thread(() -> PDFThumbsGenerator.processFile(subbmittedFilename)).start();
//                ret.put("msg", "process started");
//            } else {
//                ret.put("msg", "not exists");
//            }
        }
        return ret;
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
