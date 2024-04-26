package cz.inovatika.knav.netlet.netleteditor;

import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author alberto
 */
public class UpdaterTask extends TimerTask {
  public static final Logger LOGGER = Logger.getLogger(UpdaterTask.class.getName());

  @Override
  public void run() {
    
    try {
      PDFThumbsGenerator.check();
    } catch (Exception ex) {
      LOGGER.log(Level.SEVERE, null, ex);
    }
  }
}