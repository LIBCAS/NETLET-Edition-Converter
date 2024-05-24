
package cz.inovatika.knav.netlet.netleteditor;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import javax.imageio.ImageIO;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author alber
 */
public class Imagging {
    
    public static void processSelection(String filename, JSONArray selection) throws IOException {
        for (int i = 0; i < selection.length(); i++) {
            JSONObject json = selection.getJSONObject(i);
            processOneSelection(filename, json);
            
        }
    }
    
    public static BufferedImage processOneSelection(String filename, JSONObject json) throws IOException {

            File f = Storage.imageFile(filename, json.getString("page"));
            BufferedImage in = ImageIO.read(f);
            if (json.has("selection")) {
                int left = Math.round(json.getJSONObject("selection").getFloat("left"));
                int top = Math.round(json.getJSONObject("selection").getFloat("top"));
                int width = Math.round(json.getJSONObject("selection").getFloat("right")) - left;
                int height = Math.round(json.getJSONObject("selection").getFloat("bottom")) - top;
                return in.getSubimage(left, top, width, height); 
                
            } else {
                return in;
            }
            //    byte[] fileContent = FileUtils.readFileToByteArray(f);
            
        
    }
    
    
}
