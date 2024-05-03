package cz.inovatika.knav.netlet.netleteditor;

import cz.inovatika.knav.netlet.netleteditor.index.Annotator;
import cz.inovatika.knav.netlet.netleteditor.index.HikoKeywordsIndexer;
import cz.inovatika.knav.netlet.netleteditor.index.Indexer;
import cz.inovatika.knav.netlet.netleteditor.index.NameTag;
import cz.inovatika.knav.netlet.netleteditor.index.SolrTaggerAnalyzer;
import cz.inovatika.knav.netlet.netleteditor.index.Translator;
import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.FileUtils;
import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.io.IOUtils;
import org.apache.tika.language.detect.LanguageResult;
import org.json.JSONArray;
import org.json.JSONML;
import org.json.JSONObject;

/**
 *
 * @author alberto
 */
@WebServlet(name = "DataServlet", urlPatterns = {"/data/*"})
public class DataServlet extends HttpServlet {

    public static final Logger LOGGER = Logger.getLogger(DataServlet.class.getName());

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
                JSONObject ret = new JSONObject();
                // Create a factory for disk-based file items
                DiskFileItemFactory factory = new DiskFileItemFactory();

// Configure a repository (to ensure a secure temp location is used)
                ServletContext servletContext = req.getServletContext();
                File repository = (File) servletContext.getAttribute("javax.servlet.context.tempdir");
                factory.setRepository(repository);

// Create a new file upload handler
                ServletFileUpload upload = new ServletFileUpload(factory);

// Parse the request
                List<FileItem> items = upload.parseRequest(req);

                JSONObject fileSettings = new JSONObject();
                String filename = null;

                // Process the uploaded items
                Iterator<FileItem> iter = items.iterator();
                while (iter.hasNext()) {
                    FileItem item = iter.next();
                    if (item.isFormField()) {
                        // neni
                        fileSettings.put(item.getFieldName(), item.getString("UTF-8"));
                    } else {
                        filename = item.getName();
                        String pdfDir = Storage.pdfDir(filename);
                        File d = new File(pdfDir);
                        d.mkdirs();
                        String fileName = pdfDir + File.separator + item.getName();
                        File uploadedFile = new File(fileName);
                        if (uploadedFile.exists()) {
                            try {
                                boolean deleted = uploadedFile.delete();
                                if (!deleted) {
                                    return ret.put("error", "can't delete file");
                                }
                            } catch (Exception ioex) {
                                LOGGER.log(Level.SEVERE, null, ioex);
                                return ret.put("error", "can't delete file");
                            }
                        }
                        File f2 = new File(fileName);
                        item.write(f2);
                        if (f2.exists()) {
                            new Thread(() -> PDFThumbsGenerator.processFile(fileName)).start();
                            ret.put("msg", "process started");
                        } else {
                            ret.put("msg", "not exists");
                        }
                    }
                }
                if (filename != null) {
                    File f = Storage.configFile(filename);
                    fileSettings.put("prompt", Options.getInstance().getString("defaultPrompt").replace("###NAME###", "z knihy \"" + fileSettings.optString("name", "") + "\""));
                    FileUtils.writeStringToFile(f, fileSettings.toString(), "UTF-8");
                }
                return ret;
            }
        },
        DOCUMENTS {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                return PDFThumbsGenerator.getDocuments();
            }
        },
        DOCUMENT {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                String filename = request.getParameter("file");
                File f = new File(Storage.imagesDir(filename));
                String[] files = f.list();
                ret.put("pages", files.length);
                return ret;
            }
        },
        ALTO {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                String filename = request.getParameter("filename");
                int page = Integer.parseInt(request.getParameter("page"));
                boolean keepOrder = Boolean.parseBoolean(request.getParameter("keepOrder"));
                File f = Storage.altoPageFile(filename, page);

                if (f.exists()) {
                    String xml = FileUtils.readFileToString(f, "UTF-8");
                    if (keepOrder) {
                        ret = JSONML.toJSONObject(xml);
                    } else {
                        ret = Utils.altoXMLToJSON(xml);
                    }
                } else {
                    ret.put("error", "File not found");
                }
                return ret;
            }
        },
        CONFIG {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                String filename = request.getParameter("filename");
                File f = Storage.configFile(filename);

                if (f.exists()) {
                    String json = FileUtils.readFileToString(f, "UTF-8");
                    ret = new JSONObject(json);
                    if (!ret.has("prompt")) {
                        ret.put("prompt", Options.getInstance().getString("defaultPrompt").replace("###NAME###", ""));
                    }
                } else {
                    // ret.put("error", "File not found");
                    LOGGER.log(Level.INFO, "No config. Creating empty");
                    ret = Options.getInstance().getJSONObject("file_config");
                    ret.put("prompt", Options.getInstance().getString("defaultPrompt").replace("###NAME###", ""));
                }
                return ret;
            }
        },
        SAVE_CONFIG {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                try {
                    if (request.getMethod().equals("POST")) {
                        JSONObject js = new JSONObject(IOUtils.toString(request.getInputStream(), "UTF-8"));

                        String filename = request.getParameter("filename");
                        File f = Storage.configFile(filename);
                        FileUtils.writeStringToFile(f, js.toString(), "UTF-8");
                        ret.put("msg", "File saved");
                    }
                } catch (Exception ex) {
                    LOGGER.log(Level.SEVERE, null, ex);
                    ret.put("error", "Error saving file");
                }
                return ret;
            }

        },
        REMOVE_LETTER {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                try {
                    String id = request.getParameter("id");
                    ret = Indexer.removeLetter(id);
                } catch (Exception ex) {
                    LOGGER.log(Level.SEVERE, null, ex);
                    ret.put("error", ex);
                }
                return ret;
            }

        },
        GET_LETTER {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                try {
                    String id = request.getParameter("id");
                    ret = Indexer.getLetter(id);
                } catch (Exception ex) {
                    LOGGER.log(Level.SEVERE, null, ex);
                    ret.put("error", ex);
                }
                return ret;
            }

        },
        GET_LETTERS {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {

                JSONObject ret = new JSONObject();
                try {
                    String id = request.getParameter("filename");
                    ret = Indexer.getLetters(id);
                } catch (Exception ex) {
                    LOGGER.log(Level.SEVERE, null, ex);
                    ret.put("error", ex);
                }
                return ret;

            }
        },
        SAVE_LETTER {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                try {
                    if (request.getMethod().equals("POST")) {
                        JSONObject js = new JSONObject(IOUtils.toString(request.getInputStream(), "UTF-8"));

                        String filename = request.getParameter("filename");
                        ret = Indexer.saveLetter(filename, js);
                    }
                } catch (Exception ex) {
                    LOGGER.log(Level.SEVERE, null, ex);
                    ret.put("error", "Error saving file");
                }
                return ret;
            }

        },
        INDEX {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                String filename = request.getParameter("filename");

                ret = Indexer.indexPdfFile(filename);
                return ret;
            }
        },
        INDEX_SIMPLE_KEYWORDS {
            @Override
            JSONObject doPerform(HttpServletRequest req, HttpServletResponse response) throws Exception {

                JSONObject json = new JSONObject();
                try {
                    Indexer indexer = new Indexer();
                    json.put("keywords", indexer.indexKeywords());

                } catch (Exception ex) {
                    LOGGER.log(Level.SEVERE, null, ex);
                    json.put("error", ex.toString());
                }
                return json;
            }
        },
        INDEX_HIKO {
            @Override
            JSONObject doPerform(HttpServletRequest req, HttpServletResponse response) throws Exception {

                JSONObject json = new JSONObject();
                try {
                    HikoKeywordsIndexer hi = new HikoKeywordsIndexer();
                    json.put("keywords", hi.full());
                } catch (Exception ex) {
                    LOGGER.log(Level.SEVERE, null, ex);
                    json.put("error", ex.toString());
                }
                return json;
            }
        },
        FIND_TAGS {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {

                JSONObject json = new JSONObject();
                try {
                    if (request.getMethod().equals("POST")) {
                        String text = IOUtils.toString(request.getInputStream(), "UTF-8");
                        json = SolrTaggerAnalyzer.getTagsJSON(text, "key_tagger_cze");
                        json.put("nametag", NameTag.recognize(text));
                    }

                } catch (Exception ex) {
                    LOGGER.log(Level.SEVERE, null, ex);
                    json.put("error", ex.toString());
                }
                return json;
            }
        },
        FIND {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();

                if (request.getMethod().equals("POST")) {
                    JSONObject js = new JSONObject(IOUtils.toString(request.getInputStream(), "UTF-8"));
                    ret = Indexer.findSimilar(js);
                }

                return ret;
            }
        },
        TRANSLATE {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {

                JSONObject json = new JSONObject();
                try {
                    if (request.getMethod().equals("POST")) {
                        String text = IOUtils.toString(request.getInputStream(), "UTF-8");

                        json = Translator.translate(text);
                    }

                } catch (Exception ex) {
                    LOGGER.log(Level.SEVERE, null, ex);
                    json.put("error", ex.toString());
                }
                return json;
            }
        },
        DETECT_LANG {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                String text = "";
                if (request.getMethod().equals("POST")) {
                    text = IOUtils.toString(request.getInputStream(), "UTF-8");
                } else {
                    text = request.getParameter("text");
                }

                List<LanguageResult> langs = Translator.detectLanguages(text);
                String src_lang = langs.get(0).getLanguage();
                // String src_lang = detectLang(text);
                ret = new JSONObject()
                        .put("lang", src_lang);
                for (LanguageResult l : langs) {
                    ret.append("languages", l.getLanguage());
                }

                return ret;
            }
        },
        ANNOTATE {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                if (request.getMethod().equals("POST")) {
                    JSONObject data = new JSONObject(IOUtils.toString(request.getInputStream(), "UTF-8"));
                    ret.put("response", Annotator.annotate(data.getString("text"), data.getString("prompt")));
                    // return ret.put("response", Annotator.annotateMock(text));
                }

                return ret;
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
