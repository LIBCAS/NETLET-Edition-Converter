package cz.knav.netlet.netleteditor;

import java.awt.Color;
import java.awt.Graphics;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.util.Base64;
import javax.imageio.ImageIO;
import javax.imageio.ImageTypeSpecifier;
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

        File f = Storage.imageFile(filename, (json.getInt("page") - 1) + "");
        BufferedImage in = ImageIO.read(f);
        if (json.has("selection")) {
            BufferedImage bi = new BufferedImage(in.getWidth(), in.getHeight(), BufferedImage.TYPE_INT_RGB);

            Graphics g = bi.createGraphics();

            g.setColor(Color.white);
            g.setPaintMode();
            g.fillRect(0, 0, in.getWidth(), in.getHeight());
            JSONArray selection = json.getJSONArray("selection");
            for (int i = 0; i < selection.length(); i++) {
                int left = Math.round(selection.getJSONObject(i).getFloat("left"));
                int top = Math.round(selection.getJSONObject(i).getFloat("top"));
                int width = Math.round(selection.getJSONObject(i).getFloat("right")) - left;
                int height = Math.round(selection.getJSONObject(i).getFloat("bottom")) - top;

                BufferedImage chunk = in.getSubimage(left, top, width, height);
                g.drawImage(chunk, left, top, null);
            }
            return bi;
        } else {
            return in;
        }

    }

    public static String selectionToBase64(String filename, JSONObject json) throws IOException {
        BufferedImage bi = processOneSelection(filename, json);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(bi, "png", baos);
        return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
    }

    public static String selectionToBase64Simple(String filename, JSONObject json) throws IOException {
        BufferedImage bi = processOneSelection(filename, json);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(bi, "png", baos);
        return Base64.getEncoder().encodeToString(baos.toByteArray());
    }

}
