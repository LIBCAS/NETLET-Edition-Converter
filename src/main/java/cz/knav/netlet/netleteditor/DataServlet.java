package cz.knav.netlet.netleteditor;

import cz.knav.netlet.netleteditor.index.Annotator;
import cz.knav.netlet.netleteditor.index.DbIndexer;
import cz.knav.netlet.netleteditor.index.HikoIndexer;
import cz.knav.netlet.netleteditor.index.HikoKeywordsIndexer;
import cz.knav.netlet.netleteditor.index.Indexer;
import cz.knav.netlet.netleteditor.index.LetterMapping;
import cz.knav.netlet.netleteditor.index.NameTag;
import cz.knav.netlet.netleteditor.index.SolrTaggerAnalyzer;
import cz.knav.netlet.netleteditor.index.Translator;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.imageio.ImageIO;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.io.FileUtils;
//import org.apache.commons.fileupload2.FileItem;
//import org.apache.commons.fileupload2.disk.DiskFileItemFactory;
//import org.apache.commons.fileupload2.jakarta.servlet6.ServletFileUpload;


import org.apache.commons.io.IOUtils;
import org.apache.tika.language.detect.LanguageResult;
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
        UPLOAD {
            @Override
            JSONObject doPerform(HttpServletRequest req, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject(); 
                return ret;
            }
        },
//        PDF {
//            @Override
//            JSONObject doPerform(HttpServletRequest req, HttpServletResponse response) throws Exception {
//                JSONObject ret = new JSONObject(); 
//
//                
//
//// Configure a repository (to ensure a secure temp location is used)
//                ServletContext servletContext = req.getServletContext();
//                File repository = (File) servletContext.getAttribute("jakarta.servlet.context.tempdir");
//                factory.setRepository(repository);
//
//// Create a new file upload handler
//                ServletFileUpload upload = new ServletFileUpload(factory);
//
//// Parse the request
//                List<FileItem> items = upload.parseRequest(req);
//
//                JSONObject fileSettings = new JSONObject();
//                String filename = null;
//
//                // Process the uploaded items
//                Iterator<FileItem> iter = items.iterator();
//                while (iter.hasNext()) {
//                    FileItem item = iter.next();
//                    if (item.isFormField()) {
//                        // neni
//                        fileSettings.put(item.getFieldName(), item.getString("UTF-8"));
//                    } else {
//                        filename = item.getName();
//                        String pdfDir = Storage.pdfDir(filename);
//                        File d = new File(pdfDir);
//                        d.mkdirs();
//                        String fileName = pdfDir + File.separator + item.getName();
//                        File uploadedFile = new File(fileName);
//                        if (uploadedFile.exists()) {
//                            try {
//                                boolean deleted = uploadedFile.delete();
//                                if (!deleted) {
//                                    return ret.put("error", "can't delete file");  
//                                }
//                            } catch (Exception ioex) {
//                                LOGGER.log(Level.SEVERE, null, ioex);
//                                return ret.put("error", "can't delete file");
//                            }
//                        }
//                        File f2 = new File(fileName);
//                        item.write(f2);
//                        if (f2.exists()) {
//                            new Thread(() -> PDFThumbsGenerator.processFile(item.getName())).start();
//                            ret.put("msg", "process started");
//                        } else {
//                            ret.put("msg", "not exists");
//                        }
//                    }
//                } 
//                if (filename != null) {
//                    File f = Storage.configFile(filename);
//                    fileSettings.put("prompt", Options.getInstance().getString("defaultPrompt").replace("###NAME###", "z knihy \"" + fileSettings.optString("name", "") + "\""));
//                    FileUtils.writeStringToFile(f, fileSettings.toString(), "UTF-8");
//                }
//                return ret;
//            }
//        },
        DOCUMENTS {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = PDFThumbsGenerator.getDocuments();
                ret.put("tenants", Indexer.getTenants().getJSONObject("facet_counts").getJSONObject("facet_fields").getJSONObject("tenant")); 
                ret.put("gptModels", Options.getInstance().getJSONArray("gptModels"));
//                JSONArray gptModels = new JSONArray();
//                gptModels.put("gpt-3.5-turbo");
//                gptModels.put("gpt-4o");
//                ret.put("gptModels", gptModels);
                return ret;
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
        INDEX_HIKO_IDENTITIES {
            @Override
            JSONObject doPerform(HttpServletRequest req, HttpServletResponse response) throws Exception {

                JSONObject json = new JSONObject();
                try {
                    HikoKeywordsIndexer hi = new HikoKeywordsIndexer();
                    //json.put("identities", hi.identities());
                    //json.put("locations", hi.locations());
                    // json.put("places", hi.places());
                    json.put("letter_place", hi.letter_place());
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
        TRANSLATE_TO_EN {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {

                JSONObject json = new JSONObject();
                try {
                    if (request.getMethod().equals("POST")) {
                        String text = IOUtils.toString(request.getInputStream(), "UTF-8");

                        json = Translator.translate(text, "cs", "en");
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
                    ret = Annotator.annotate(data.getString("text"), data.getString("prompt"), data.optString("gptModel"));
                    // return ret.put("response", Annotator.annotateMock(text));
                }

                return ret;
            }
        },
        ANALYZE_IMAGES {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                if (request.getMethod().equals("POST")) {
                    JSONObject data = new JSONObject(IOUtils.toString(request.getInputStream(), "UTF-8"));
                    ret = Annotator.analyzeImages(data.getString("filename"), 
                            data.getJSONArray("selection"), 
                            data.getString("prompt"), 
                            data.optString("gptModel"));
                    // return ret.put("response", Annotator.annotateMock(text));
                }

                return ret;
            }
        },
        CREATE_IMAGE {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                response.setContentType("image/jpeg");
                JSONObject data = new JSONObject(request.getParameter("data"));
                BufferedImage bi = Imagging.processOneSelection(data.getString("filename"),
                        data.getJSONObject("selection"));
                ImageIO.write(bi, "jpg", response.getOutputStream());
                return null;
            }
        },
        GET_PROMPT {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                String p = Options.getInstance().getPrompt();
                ret.put("prompt", p);
                return ret;
            }
        },
        SAVE_PROMPT {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();

                if (request.getMethod().equals("POST")) {
                    String p = IOUtils.toString(request.getInputStream(), "UTF-8");
                    Options.getInstance().savePrompt(p);
                    ret.put("prompt", p);
                }
                return ret;
            }
        },
        SAVE_LOCATION {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();

                if (request.getMethod().equals("POST")) {
                    JSONObject p = new JSONObject(IOUtils.toString(request.getInputStream(), "UTF-8"));
                    ret = Indexer.saveLocation(p);
                }
                return ret;
            }
        },
        GET_AUTHORS {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                ret.put("authors", Indexer.getAuthors(request.getParameter("prefix"), request.getParameter("tenant")).getJSONObject("response").getJSONArray("docs"));
                return ret;
            }
        },
        GET_LOCATIONS {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                ret.put("locations", 
                        Indexer.getLocations(request.getParameter("prefix"), 
                                request.getParameter("tenant"), 
                                request.getParameter("type"))
                                .getJSONObject("response").getJSONArray("docs"));
                return ret;
            }
        },
        CHECK_PLACES {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                ret.put("req_origin", request.getParameter("origin"));
                ret.put("req_destination", request.getParameter("destination"));
                ret.put("origin", Indexer.checkPlaces(request.getParameter("origin"), 
                        request.getParameter("tenant"),
                        Boolean.parseBoolean(request.getParameter("extended"))).getJSONObject("response").getJSONArray("docs"));
                ret.put("destination", Indexer.checkPlaces(request.getParameter("destination"), 
                        request.getParameter("tenant"),
                        Boolean.parseBoolean(request.getParameter("extended"))).getJSONObject("response").getJSONArray("docs"));
                return ret;
            }
        },
        GET_PLACES {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                if (request.getParameter("tenant") != null) {
                ret.put("places", 
                        Indexer.getPlaces(request.getParameter("tenant"))
                                .getJSONObject("response").getJSONArray("docs"));
                ret.put("letter_place", 
                        Indexer.getLetterPlace(request.getParameter("tenant"))
                                .getJSONObject("response").getJSONArray("docs"));
                    
                }
                ret.put("tenants", Indexer.getTenants().getJSONObject("facet_counts").getJSONObject("facet_fields").getJSONObject("tenant")); 
                return ret;
            }
        },
        CHECK_AUTHORS {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                ret.put("req_author", request.getParameter("author"));
                ret.put("req_recipient", request.getParameter("recipient"));
                ret.put("author", Indexer.checkAuthor(request.getParameter("author"), 
                        request.getParameter("tenant"),
                        Boolean.parseBoolean(request.getParameter("extended"))).getJSONObject("response").getJSONArray("docs"));
                ret.put("recipient", Indexer.checkAuthor(request.getParameter("recipient"), 
                        request.getParameter("tenant"),
                        Boolean.parseBoolean(request.getParameter("extended"))).getJSONObject("response").getJSONArray("docs"));
                return ret;
            }
        },
        GET_LETTERS_HIKO {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                try {
                    ret = DbIndexer.getLettersFromHIKO(request.getParameter("tenant"));
                } catch (Exception ex) {
                    LOGGER.log(Level.SEVERE, null, ex);
                    ret.put("error", ex);
                }
                return ret;
            }

        },
        GET_LETTER_HIKO {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                try {
                    String id = request.getParameter("id");
                    ret = DbIndexer.getLetterFromHIKO(request.getParameter("tenant"), id);
                } catch (Exception ex) {
                    LOGGER.log(Level.SEVERE, null, ex);
                    ret.put("error", ex);
                }
                return ret;
            }

        },
        SAVE_LETTER_HIKO {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                try {
                    String js = IOUtils.toString(request.getInputStream(), "UTF-8");
                    HikoIndexer hi = new HikoIndexer();
                    ret = hi.saveLetter(js, request.getParameter("tenant"));
                } catch (Exception ex) {
                    LOGGER.log(Level.SEVERE, null, ex);
                    ret.put("error", ex);
                }
                return ret;
            }

        },
        INDEX_IDENTITIES {
            @Override
            JSONObject doPerform(HttpServletRequest req, HttpServletResponse response) throws Exception {

                JSONObject json = new JSONObject();
                try {
                    HikoIndexer hi = new HikoIndexer();
                    json.put("identities", hi.indexIdentities());
                } catch (Exception ex) { 
                    LOGGER.log(Level.SEVERE, null, ex);
                    json.put("error", ex.toString());
                }
                return json;
            }
        },
        INDEX_PLACES {
            @Override
            JSONObject doPerform(HttpServletRequest req, HttpServletResponse response) throws Exception {

                JSONObject json = new JSONObject();
                try {
                    HikoIndexer hi = new HikoIndexer();
                    json.put("identities", hi.indexPlaces());
                } catch (Exception ex) { 
                    LOGGER.log(Level.SEVERE, null, ex);
                    json.put("error", ex.toString());
                }
                return json;
            }
        },
        TR {
            @Override
            JSONObject doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {
                JSONObject ret = new JSONObject();
                try {
                    LetterMapping lt = new LetterMapping();
                    ret = lt.transform();
                } catch (Exception ex) {
                    LOGGER.log(Level.SEVERE, null, ex);
                    ret.put("error", ex);
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
