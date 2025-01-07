package cz.inovatika.knav.netlet.netleteditor;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.commons.exec.CommandLine;
import org.apache.commons.exec.DefaultExecutor;
import org.apache.commons.exec.ExecuteException;
import org.apache.commons.exec.PumpStreamHandler;

/**
 *
 * @author alberto
 */
public class OCRGenerator {

  public static final Logger LOGGER = Logger.getLogger(OCRGenerator.class.getName());

  public static boolean fromFile(String dir, String num) throws ExecuteException, IOException {

    // C:/Python38/python.exe c:/Users/alberto/Projects/NETLET/pero-ocr-0.6.1/user_scripts/pero-ocr.py -i ../images/KOR_TGM_Beneš_I.pdf/58.jpg -oO output.txt -oA alto.xml
    String file = dir + Options.getInstance().getString("images_dir") + File.separator + num + ".jpg";
    String output = dir + Options.getInstance().getString("txt_dir") + File.separator + num + ".txt";
    String alto = dir + Options.getInstance().getString("alto_dir") + File.separator + num + ".xml";
    new File(dir + Options.getInstance().getString("images_dir")).mkdirs();
    new File(dir + Options.getInstance().getString("txt_dir")).mkdirs();
    new File(dir + Options.getInstance().getString("alto_dir")).mkdirs();
    String line = String.format("%s %s -i %s -oO %s -oA %s", 
            Options.getInstance().getString("python_exe"), 
            Options.getInstance().getString("python_script"), 
            file, 
            output, 
            alto);
    
    LOGGER.log(Level.INFO, "proccessing {0}", line);
    CommandLine cmdLine = CommandLine.parse(line);

    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    PumpStreamHandler streamHandler = new PumpStreamHandler(outputStream);

    DefaultExecutor executor = new DefaultExecutor();
    executor.setStreamHandler(streamHandler);

    int exitCode = executor.execute(cmdLine);
    String out = outputStream.toString();
    if (exitCode > 0) {
      LOGGER.log(Level.WARNING, "Can't generate ocr for page {0}", num);
      LOGGER.log(Level.WARNING, "Response {0}", out);
      return false;
    } else {
      LOGGER.log(Level.INFO, "alto {0} generated", num);
      return true;
    } 
  }
}
