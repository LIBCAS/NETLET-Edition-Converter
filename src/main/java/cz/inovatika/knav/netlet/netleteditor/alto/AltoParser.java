package cz.inovatika.knav.netlet.netleteditor.alto;

import com.alibaba.fastjson2.JSON;
import cz.inovatika.knav.netlet.netleteditor.Options;
import cz.inovatika.knav.netlet.netleteditor.Storage;
import java.io.File;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.commons.io.FileUtils;
import org.json.JSONObject;
import org.json.XML;

/**
 *
 * @author alberto
 */
public class AltoParser {

  public static final Logger LOGGER = Logger.getLogger(AltoParser.class.getName());

  public JSONObject findSimilar(String filename, int page, String jsonBlock) {
    JSONObject ret = new JSONObject();
    try {
      
      AltoBlock ab = JSON.parseObject(jsonBlock, AltoBlock.class);
      
      
      File f = Storage.altoPageFile(filename, page);

      if (f.exists()) {
        String xml = FileUtils.readFileToString(f, "UTF-8");
        // ret = JSONML.toJSONObject(xml);
        ret = XML.toJSONObject(xml);
      } else {
        ret.put("error", "File not found");
      }

    } catch (IOException ex) {
      Logger.getLogger(AltoParser.class.getName()).log(Level.SEVERE, null, ex);
    }
    return ret;
  }

}
