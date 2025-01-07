package cz.knav.netlet.netleteditor;

import cz.knav.netlet.netleteditor.index.Indexer;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException; 
import java.util.logging.Level;
import java.util.logging.Logger;
import net.coobird.thumbnailator.ThumbnailParameter;
import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.filters.Canvas;
import net.coobird.thumbnailator.geometry.Positions;
import org.apache.commons.io.FileUtils;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.json.JSONException;
import org.json.JSONObject;

/**
 *
 * @author alberto
 */
public class PDFThumbsGenerator {

    public static final Logger LOGGER = Logger.getLogger(PDFThumbsGenerator.class.getName());

    public static int generated;
    public static int maxPixels;
    public static int maxMedium;

    public static JSONObject getDocuments() throws IOException {
        JSONObject ret = new JSONObject();

        String[] dirs = Storage.getDocuments();
        for (String dir : dirs) {
            File config = new File(Storage.pdfsDir() + File.separator + dir + File.separator + "config.json");
            JSONObject c = new JSONObject();
            if (config.exists()) {
                c = new JSONObject(FileUtils.readFileToString(config, "UTF-8"));
            }

            ret.append("dirs", new JSONObject()
                    .put("filename", dir)
                    .put("file_id", Indexer.hashString(dir))
                    .put("config", c)
                    .put("imgs", new File(Storage.imagesDir(dir)).list().length)
                    .put("alto", new File(Storage.altoDir(dir)).list().length)
                    .put("txt", new File(Storage.txtDir(dir)).list().length));
            
            ret.put("totals", Indexer.getLettersTotals().getJSONObject("facet_counts").getJSONObject("facet_fields").getJSONObject("filename"));
        }

        return ret;

    }

    public static JSONObject check(boolean isTask) throws IOException {
                LOGGER.log(Level.INFO, "Running check");
        JSONObject ret = new JSONObject();
        String[] dirs = Storage.getDocuments();
        for (String dir : dirs) {
            int imgs = new File(Storage.imagesDir(dir)).list().length;
            int alto = new File(Storage.altoDir(dir)).list().length;
            if (alto < imgs) {
                LOGGER.log(Level.INFO, "Running alto for {0}", dir);
                ret.put(dir, generateAlto(dir, false, isTask));
            }
        }
        return ret;

    }

    public static JSONObject stop(boolean isTask) throws IOException {
                LOGGER.log(Level.INFO, "Running check");
        JSONObject ret = new JSONObject();
        InitServlet.stopFuture();
        ret.put("msg", "Checking ALTO stopped");
        return ret;
    }
    
    public static JSONObject processFile(String fileName) {
        JSONObject ret = new JSONObject();
        try {
            ret.put("images", generateImages(fileName, true));
            ret.put("alto", generateAlto(fileName, true, false));
        } catch (JSONException ex) {
            LOGGER.log(Level.SEVERE, null, ex);
        }
        return ret;
    }

    public static JSONObject processFilePython(String fileName) {
        File f = new File(fileName);
        maxPixels = Options.getInstance().getInt("maxPixels", maxPixels);
        maxMedium = Options.getInstance().getInt("maxMedium", maxMedium);
        LOGGER.log(Level.INFO, "Generating thumbs for pdf {0}", f);
        JSONObject ret = new JSONObject();
        try {
            String pdfDir = Storage.pdfDir(f.getName());
            String destDir = Storage.imagesDir(f.getName());
            new File(destDir).mkdirs();
            int pageCounter = 0;
            try (PDDocument document = PDDocument.load(f)) {
                PDFRenderer pdfRenderer = new PDFRenderer(document);
                for (PDPage page : document.getPages()) {
                    LOGGER.log(Level.INFO, "page {0}", pageCounter + 1);
                    BufferedImage bim = getImageFromPage(pdfRenderer, page.getMediaBox(), pageCounter);
                    if (bim != null) {
                        processPage(bim, pageCounter, destDir);
                        boolean sucess = OCRGenerator.fromFile(pdfDir, pageCounter + "");
                        if (sucess) {
                            // Indexer.indexPage(f.getName(), pageCounter);
                        }
                    } else {
                        LOGGER.log(Level.WARNING, "Can't generate image for page {0}", pageCounter);
                        ret.append("warnings", "Can't generate image for page " + pageCounter);
                    }
                    pageCounter++;
                }
                ret.put("pages", pageCounter).put("dir", destDir);

                ret.put("Index", Indexer.indexPdfFile(f.getName()));

            } catch (IOException ex) {
                LOGGER.log(Level.SEVERE, f.getName() + " has error: {0}", ex);
                LOGGER.log(Level.SEVERE, null, ex);
                ret.put("error", ex);
            } catch (Exception ex) {
                LOGGER.log(Level.SEVERE, f.getName() + " has error: {0}", ex);
                LOGGER.log(Level.SEVERE, null, ex);
                ret.put("error", ex);
            }
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
        }
        return ret;
    }

    public static JSONObject generateImages(String fileName, boolean overwrite) {
        String pdfDir = Storage.pdfDir(fileName);
        File f = new File(pdfDir + fileName);
        maxPixels = Options.getInstance().getInt("maxPixels", maxPixels);
        maxMedium = Options.getInstance().getInt("maxMedium", maxMedium);
        LOGGER.log(Level.INFO, "Generating thumbs for pdf {0}", f);
        JSONObject ret = new JSONObject();
        try {
            String destDir = Storage.imagesDir(f.getName());
            new File(destDir).mkdirs();
            int pageCounter = 0;
            try (PDDocument document = PDDocument.load(f)) {
                PDFRenderer pdfRenderer = new PDFRenderer(document);
                for (PDPage page : document.getPages()) {
                    File imgF = new File(destDir + (pageCounter) + ".jpg");
                    if (overwrite || !imgF.exists()) {
                        LOGGER.log(Level.INFO, "page {0}", pageCounter + 1);
                        BufferedImage bim = getImageFromPage(pdfRenderer, page.getMediaBox(), pageCounter);
                        if (bim != null) {
                            processPage(bim, pageCounter, destDir);
                        } else {
                            LOGGER.log(Level.WARNING, "Can't generate image for page {0}", pageCounter);
                            ret.append("warnings", "Can't generate image for page " + pageCounter);
                        }
                    } else {
                        LOGGER.log(Level.INFO, "page {0} skipped", pageCounter + 1);
                    }
                    pageCounter++;
                }
                ret.put("pages", pageCounter).put("dir", destDir);

            } catch (IOException ex) {
                LOGGER.log(Level.SEVERE, f.getName() + " has error: {0}", ex);
                LOGGER.log(Level.SEVERE, null, ex);
                ret.put("error", ex);
            } catch (Exception ex) {
                LOGGER.log(Level.SEVERE, f.getName() + " has error: {0}", ex);
                LOGGER.log(Level.SEVERE, null, ex);
                ret.put("error", ex);
            }
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, null, ex);
        }
        return ret;
    }

    public static JSONObject generateAlto(String fileName, boolean overwrite, boolean isTask) {
        //File f = new File(pdfDir + fileName);
        LOGGER.log(Level.INFO, "Generating alto for pdf {0}", fileName);
        JSONObject ret = new JSONObject();
        try {
            String pdfDir = Storage.pdfDir(fileName);
            File fi = new File(Storage.imagesDir(fileName));
            String[] imgs = fi.list();
            for (String img : imgs) {
                String imgNum = img.split("\\.")[0];
                String alto = pdfDir + Options.getInstance().getString("alto_dir") + File.separator + imgNum + ".xml";
                File altoFile = new File(alto);
                if (overwrite || !altoFile.exists()) {
                    // boolean sucess = OCRGenerator.fromFile(pdfDir, imgNum);
                    boolean sucess = PERORequester.generate(pdfDir, imgNum);
                    ret.put(imgNum + "", sucess);
                } else {
                    // LOGGER.log(Level.INFO, "file {0} exists -> {1}", new Object[]{alto, altoFile.exists()});
                    LOGGER.log(Level.INFO, "page {0} skipped", imgNum);
                }
                if (!InitServlet.taskRunning && isTask) {
                     LOGGER.log(Level.INFO, "Task stopped");
                    return ret;
                }
            }
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, fileName + " has error: {0}", ex);
            LOGGER.log(Level.SEVERE, null, ex);
            ret.put("error", ex);
        }
        return ret;
    }

    private static BufferedImage getImageFromPage(PDFRenderer pdfRenderer,
            PDRectangle mediaBox, int page) throws Exception {
        float width = mediaBox.getWidth();
        float height = mediaBox.getHeight();
        if (width * height > maxPixels) {
            LOGGER.log(Level.WARNING, "Big image {0} x {1}", new Object[]{width, height});
            return null;
        } else {
            float ratio = Math.max(getRenderRatio(width), getRenderRatio(height));
            return pdfRenderer.renderImageWithDPI(page, 72 * ratio, ImageType.RGB);
        }
    }

    private static float getRenderRatio(float boxDim) {
        return (boxDim <= 1) ? 10f : (float) (maxMedium / boxDim);
    }

    public static void processPage(BufferedImage bim, int pageCounter, String destDir) throws IOException {

        String outputFile = null;

        int width = bim.getWidth();
        int height = bim.getHeight();

        if (width * height < maxPixels) {
            int w;
            int h;
            if ((width < maxMedium) && (height < maxMedium)) {
                LOGGER.log(Level.WARNING, "Resized image too small at {0} x {1}.",
                        new Object[]{width, height});
                w = width;
                h = height;
            } else {
                if (height > width) {
                    double ratio = maxMedium * 1.0 / height;
                    w = (int) Math.max(1, Math.round(width * ratio));
                    h = maxMedium;
                } else {
                    double ratio = maxMedium * 1.0 / width;
                    h = (int) Math.max(1, Math.round(height * ratio));
                    w = maxMedium;
                }
            }

            outputFile = destDir + (pageCounter) + ".jpg";
            File f = new File(outputFile);
            resizeWithThumbnailator(bim, w, h, f, getImageType(bim));
            generated++;

        } else {
            // writeSkipped(pageCounter, id, width + " x " + height);
        }

    }

    private static int getImageType(BufferedImage img) {

        return (img.getColorModel().getPixelSize() == 8) ? BufferedImage.TYPE_BYTE_GRAY : ThumbnailParameter.ORIGINAL_IMAGE_TYPE;
    }

    private static void resizeWithThumbnailator(BufferedImage srcImage, int w, int h, File f, int imageType) {
        try {
            Thumbnails.of(srcImage)
                    .outputFormat("jpg")
                    .size(w, h)
                    .addFilter(new Canvas(w, h, Positions.CENTER, Color.WHITE))
                    .imageType(imageType)
                    .toFile(f);
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error in image resizer:", ex);
        }
    }
}
