/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package cz.inovatika.knav.netlet.netleteditor;

import java.io.File;

/**
 *
 * @author alberto
 */
public class Storage {
  
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
