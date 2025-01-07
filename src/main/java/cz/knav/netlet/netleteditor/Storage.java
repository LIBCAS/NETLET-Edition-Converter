package cz.inovatika.knav.netlet.netleteditor;

import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;

/**
 *
 * @author alberto
 */
public class Storage {

    public static String[] getDocuments() throws IOException {
        File f = new File(pdfsDir());
        return f.list(new FilenameFilter() {
            @Override
            public boolean accept(File current, String name) {
                return new File(current, name).isDirectory();
            }
        });
    }
  
  public static String pdfsDir() {
    return Options.getInstance().getString("data_dir") + File.separator;
  }
  
  public static String pdfDir(String filename) {
    return Options.getInstance().getString("data_dir") + File.separator + filename + File.separator;
  }
  
  public static String imagesDir(String filename) {
    return pdfDir(filename) + Options.getInstance().getString("images_dir") + File.separator;
  }
  
  public static String altoDir(String filename) {
    return pdfDir(filename) + Options.getInstance().getString("alto_dir") + File.separator;
  }
  
  public static String txtDir(String filename) {
    return pdfDir(filename) + Options.getInstance().getString("txt_dir") + File.separator;
  }
  
  public static File imageFile(String filename, String page) {
    return new File(imagesDir(filename) + page + ".jpg");
  }
  
  public static String altoPageFileName(String filename, int page) {
    return altoDir(filename) + page + ".xml";
  }
  
  public static File altoPageFile(String filename, int page) {
    return new File(altoPageFileName(filename, page));
  }
  
  public static File configFile(String filename) {
    return new File(pdfDir(filename) + "config.json");
  }
  
  public static File defConfigFile() {
    return new File(pdfsDir() + "config.json");
  }
  
}
