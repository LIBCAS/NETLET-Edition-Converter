 
package cz.inovatika.knav.netlet.netleteditor;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.imageio.ImageIO;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.IOUtils;
import org.json.JSONObject;

/**
 *
 * @author alberto
 */
@WebServlet(name = "ImageServlet", urlPatterns = {"/img/*"})
public class ImageServlet extends HttpServlet {

    public static final Logger LOGGER = Logger.getLogger(ImageServlet.class.getName());

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
        try {
            String actionNameParam = request.getPathInfo().substring(1);
            if (actionNameParam != null) {
                Actions actionToDo = Actions.valueOf(actionNameParam.toUpperCase());
                actionToDo.doPerform(request, response);
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
        FULL {
            @Override
            void doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                response.setContentType("image/jpeg");
                String filename = request.getParameter("filename");
                String page = request.getParameter("page");
                String destDir = Options.getInstance().getString("data_dir") + File.separator + filename + File.separator + Options.getInstance().getString("images_dir") + File.separator;

                File f = new File(destDir + page + ".jpg");

                if (f.exists()) {
                    response.setContentType("image/jpeg");
                    response.setHeader("Content-Disposition", "filename=" + f.getName());
                    IOUtils.copy(new FileInputStream(f), response.getOutputStream());
                } else {
                    response.setContentType("application/json;charset=UTF-8");
                    JSONObject json = new JSONObject().put("error", "file " + f.getAbsolutePath() + "doesn't exists");
                    response.getWriter().println(json.toString(2));
                }
            }
        },
        SELECTION {
            @Override
            void doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                response.setContentType("image/jpeg");
                JSONObject data = new JSONObject(request.getParameter("data"));
                BufferedImage bi = Imagging.processOneSelection(data.getString("filename"),
                        data.optJSONObject("selection", new JSONObject()));
                ImageIO.write(bi, "jpg", response.getOutputStream());
            }
        };

        abstract void doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception;
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
